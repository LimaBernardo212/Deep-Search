import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import path from 'path';
import nodemailer from 'nodemailer';
import crypto from 'crypto';  // ← Adicione isso
import { fileURLToPath } from 'url'; 
import coding from './codeSchema.js'
import StoreCad from './StoreCadschema.js';

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));
app.use(cookieParser());

// ✅ CORRIGIDO: Transporter com SSL configurado
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d357f63add29f7",
    pass: "fc32811f387516"
  }
});
// ✅ Testa conexão ao iniciar
transport.verify((error, success) => {
    if (error) {
        console.error('❌ Erro na configuração do email:', error.message);
    } else {
        console.log('✅ Servidor de email pronto para enviar mensagens');
    }
});

// Conectar ao MongoDB
const conectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado ao MongoDB com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao conectar MongoDB:', error);
    }
}
conectDB();

// Middleware de verificação de token
function tokenVerify(req, res, next) {
    const token = req.cookies.authToken;
    
    if (!token) {
        return res.status(401).json({ error: 'Acesso Negado' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email,
            itsNew: decoded.itsNew
        };
        req.userId = decoded.id;
        req.userName = decoded.name;
        req.userEmail = decoded.email;
        req.itsNew = decoded.itsNew;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token Inválido' });
    }
}

// ✅ NOVA FUNÇÃO: Enviar email de recuperação COM TOKEN
async function enviarEmailRecuperacao(email, resetToken) {
    const resetUrl = `http://localhost:3000/reset-password.html`;
    
    const emailOptions = {
        from: 'bernardolimarodrigues4@gmail.com',
        to: email,
        subject: 'Password recovery',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        
                        background-color: #0D0D0D;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                    .container { 
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        padding: 20px;
                        background-color: transparent;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .GreenCard{
    color: #238C6E;
    font-family: Arial, Helvetica, sans-serif;
}
                    .pointer{
    width: 3vw;
    height: 3vh;
   
    margin-left: 5px;
    font-family: Arial, Helvetica, sans-serif;
    background-color: #f2f2f2;
    color: #f2f2f2;
    animation-name: pisk;
    animation-duration: 0.7s;
    animation-iteration-count: infinite;
    animation-timing-function: steps(1);
    
}
@keyframes pisk {
    0%{
        opacity: 0;
    }
    50%{
        opacity: 1;
    }
    100%{
        opacity: 0;
    }
    
}

                    .header {
                        text-align: center;
                        padding: 20px 0;
                        color: #f2f2f2;
                        font-family: Arial, Helvetica, sans-serif;
                        border-bottom: 2px solid #238C6E;
                        margin-bottom: 20px;
                    }
                    
                    
                    .link-box {
                        background-color: #238C6E;
                        padding: 10px;
                        border-radius: 5px;
                        word-break: break-all;
                        font-size: 12px;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: #f2f2f2;
                    }
                    .container p{
                        color: #f2f2f2;
                        margin: 5px;
                        font-family: Arial, Helvetica, sans-serif;
                    }
                    #diferent{
                        margin: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Password <strong class="GreenCard">Recovery</strong><strong class="pointer">||</strong></h2>
                    </div>
                    
                    <p>Hi,</p>
                    <p>How are you?</p>
                    
                    <p>
                        You requested a password reset at https://log.bussiness
                    </p>
                    
                    <p id="diferent">Paste the code below on our website and reset your password:</p>
                    <div class="link-box">${resetToken}</div>
                    
                </div>
            </body>
            </html>
        `
    };
    
    // ✅ IMPORTANTE: Retorna a Promise para poder tratar erros
    return await transport.sendMail(emailOptions);
}

// ========================================
// SUAS ROTAS DE LOGIN (permanecem iguais)
// ========================================
app.post('/api/login', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
        }

        const usuario = await User.findOne({ Email: email });

        if (usuario) {
            const senhaValida = await bcrypt.compare(password, usuario.password);

            if (!senhaValida) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const payload = {
                id: usuario._id.toString(),
                email: usuario.Email,
                name: usuario.nome,
                itsNew: false
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

            res.cookie("authToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            res.redirect('/home.html')
        } else {
            const senhaHash = await bcrypt.hash(password, 10);

            const novoUser = await User.create({
                nome: name,
                Email: email,
                password: senhaHash,
                isStore: false
            });

            const payload = {
                id: novoUser._id.toString(),
                email: novoUser.Email,
                name: novoUser.nome,
                itsNew: true
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

            res.cookie("authToken", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            res.redirect('/home.html')
        }
    } catch (error) {
        console.error('❌ Erro em /api/login:', error);
        return res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.post('/api/login/authGoogle', async (req, res) => {
    try {
        const { name, email, sub } = req.body;

        if (!name || !email || !sub) {
            return res.status(400).json({ msg: 'Dados incompletos' });
        }

        console.log('📝 Login Google recebido:', { name, email, sub });

        let googleUsuario = await User.findOne({Email: email });

        if (googleUsuario) {
            googleUsuario.nome = name;
            googleUsuario.Email = email;
            googleUsuario.id = sub;
            
            console.log('✅ Usuário Google atualizado:', googleUsuario._id);

            const googlePayload = {
                id: googleUsuario._id.toString(),
                nome: googleUsuario.nome,
                Email: googleUsuario.Email,
                itsNew: false
            };

            const googleToken = jwt.sign(googlePayload, JWT_SECRET, { expiresIn: "30d" });

            res.cookie("authToken", googleToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                msg: "Sucesss",
                payload: googlePayload
            });
        } else {
            const newGoogleUser = await User.create({
                nome: name,
                Email: email,
                password: "Not shared with us"
            });

            console.log('✅ Novo usuário Google criado:', newGoogleUser._id);

            const newPayloadGoogle = {
                id: newGoogleUser._id.toString(),
                name: newGoogleUser.nome,
                email: newGoogleUser.Email,
                itsNew: true
            };

            const newGoogleUserToken = jwt.sign(newPayloadGoogle, JWT_SECRET, { expiresIn: "30d" });

            res.cookie("authToken", newGoogleUserToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                msg: "SUPER SUCESS",
                payload: newPayloadGoogle
            });
        }
    } catch (error) {
        console.error('❌ Erro em /api/login/authGoogle:', error);
        return res.status(500).json({ 
            msg: "ERROR", 
            error: error.message 
        });
    }
});

app.get('/api/me', tokenVerify, async (req, res) => {
    return res.json({
        id: req.userId,
        name: req.userName,
        email: req.userEmail
    });
});

app.post('/api/logout', (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
    
    return res.status(200).json({
        mensage: 'Logout efetuado com sucesso'
    });
});

app.get('/verifyItsNewUser', tokenVerify, (req, res) => { 
    const novo = Boolean(req.user.itsNew); 
    const file = novo ? 'index.html' : 'Login.html'; 
    res.sendFile(path.join(__dirname,'public', file)); 
});
function generateCode(){
    const coder = crypto.randomBytes(Math.ceil(6/2));
    let codigo = coder.toString('hex').slice(0, 6);
    return codigo
}
// ✅ ROTA TOTALMENTE CORRIGIDA: Solicitar recuperação de senha
app.post('/forgot-password', async (req, res, next) => {
    const {email, name} = req.body;
    try{
        const finder = await User.findOne({nome: name, Email: email})
    if (!finder){
        return res.status(404).json({error: "User don't registred in DB"})
    }
    let codet = generateCode();
    if (!codet){
        return res.status(500).json({mensage: 'Erro in generate the requester code'})
    }
   const registerCode = await coding.create({
        nome: name,
        email: email,
        code: codet
    })
    if (!registerCode){
        return res.status(500).json({error: 'Error in cad. the code'})
    }
     await enviarEmailRecuperacao(email, codet)
    res.redirect('forgot.html')
    
}catch(error){
    return res.status(500).json({mensage: 'Error in the route :<'})
}
})
app.post('/sending-password', async (req, res) => {
    const {first, second, third, fourth, fifth, sixth} = req.body;
    try {
        let hashira = `${first}${second}${third}${fourth}${fifth}${sixth}`;
    const verifyCode = await coding.findOne({code: hashira});
    if (!verifyCode){
        return res.redirect('forgot.html')
    }
    res.redirect('mypassword.html')
    } catch (error) {
        return res.status(500).json({error: 'Fatal Error'})
    }
})
app.post('/update-password', async (req, res) => {
    const {name, email, newpassword} = req.body;
    try {
        const hashPassword = await bcrypt.hash(newpassword, 10)
        const updater = await User.findOneAndUpdate({nome: name, Email: email}, {password: hashPassword})
        if (!updater){
            return res.status(404).json({error: 'User not find'})
        }
        const deleteCode = await coding.findOneAndDelete({nome: name, email: email})
        if (!deleteCode){
            return res.status(500).json({error: 'We were unable to delete the code.'})
        }
        const datas = await User.findOne({nome: name, Email: email})
        if(!datas){
            return res.status(404).json({error: 'User not find'})
        }
        const passwordPayload = {
            id: datas.id,
            name: datas.nome,
            email: datas.Email,
            itsNew: false
        }
        const passwordToken = jwt.sign(passwordPayload, JWT_SECRET, {expiresIn: '30d'})
        res.cookie("authToken", passwordToken, {
            httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 30 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({mgs: 'SUPERRRR', payload: passwordPayload})
        //res.redirect('home.html')
    } catch (error) {
        return res.status(500).json({error: 'ERROR'})
    }
})
app.post('/return/data', tokenVerify, async (req, res) => {
    const {name, email} = req.user;
    const also = req.body;
    try {
        const findAllStores = await StoreCad.find();
        if (!findAllStores){
        return res.sendStatus(404).json({error: 'Error 404'})
        }
        const storesNum = findAllStores.length;
        const htmlStructure = `<div><h1>Hello World</h1></div>`
         const returner = [];
        for (let i = 0; i < storesNum; i++) {
           returner.push(htmlStructure)
                }
        return res.status(200).json({return: returner})
       
    } catch (error) {
        return res.status(500).json({error: 'Error in the server :(<'})
    }
})
// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📧 Sistema de recuperação de senha ativo`);
});
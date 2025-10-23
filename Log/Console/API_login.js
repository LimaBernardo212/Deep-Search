import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
app.use(express.json());
app.use(express.urlencoded( { extended: true } ));
app.use(express.static("./public"));
app.use(cookieParser())
const conectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado com sucesso :>D');
    } catch (error) {
        console.log(error);
    }
}
conectDB();
function tokenVerify(req, res, next){
    const token = req.cookies.authToken;
    if (!token){
        return res.status(401).json({error : 'Acesso Negado'})
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email
        }
        req.userId = decoded.id;
        req.userName = decoded.name;
        req.userEmail = decoded.email;
        next()
    } catch (error) {
        return res.status(401).json({ error: 'Token Invalido'});
    }
}

app.post('/api/login', async (req, res) => {
    try {
         const { name , email, password} = req.body;
        const usuario = await User.findOne({nome: name, Email: email })
        
        if (usuario){
            try {
                const senhaValida = await bcrypt.compare(password, usuario.password);
        
        if (!senhaValida){
            return res.status(401).json({error: 'Credenciais invalidas'})
        }
        const payload = {
            id: usuario._id.toString(), 
            email: usuario.Email,
            name: usuario.nome
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            mensage: "Autentificado com sucesso",
            payload: payload
        })
            } catch (error) {
                console.error("Erro em /api/login");
                return res.status(500).json({
                    mensage: "Erro no server :("
                })
            }
        }
        else{
            try {
                const senhaHash = await bcrypt.hash(password, 10);
        console.log(email, name, password, false);
        if (!name || !email){
            return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
        }
    const novoUser = await User.create({
        nome: name,
        Email: email,
        password: senhaHash,
        isStore: false
    });
    const payload = {
            id: novoUser._id.toString(), 
            email: novoUser.Email,
            name: novoUser.nome
        }
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })
        return res.status(200).json({
            mensage: "Autentificado e cadastrado com sucesso",
            payload: payload
        })
    
            } catch (error) {
                return res.status(500).json({ mensage: 'FATAL ERROR IN THE SERVER'})
            }
        }
    } catch (error) {
        return res.status(500).json({error: error})
    }
})
app.get('/api/me', tokenVerify, async (req, res) => {
    return res.json({
        id: req.userId,
        name: req.userName,
        Email: req.userEmail
    })
})
app.post('/api/logout', (req, res) => {
    res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    })
    return res.status(200).json({
        mensage: 'Logout efetuado'
    })
})
app.listen(PORT, () => {
    console.log('Server rodando em http://localhost:3000')
})
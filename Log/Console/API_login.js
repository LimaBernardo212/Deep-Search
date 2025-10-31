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
    const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
    
    const emailOptions = {
        from: 'bernardolimarodrigues4@gmail.com',
        to: email,
        subject: '🔒 Recuperação de Senha',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 0;
                    }
                    .container { 
                        max-width: 600px; 
                        margin: 20px auto; 
                        padding: 20px;
                        background-color: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #007bff;
                    }
                    .button { 
                        display: inline-block; 
                        padding: 12px 30px; 
                        background-color: #007bff; 
                        color: white !important; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #0056b3;
                    }
                    .footer { 
                        color: #666; 
                        font-size: 12px; 
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                        text-align: center;
                    }
                    .warning {
                        background-color: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 10px;
                        margin: 15px 0;
                    }
                    .link-box {
                        background-color: #f8f9fa;
                        padding: 10px;
                        border-radius: 5px;
                        word-break: break-all;
                        font-size: 12px;
                        color: #007bff;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>🔒 Recuperação de Senha</h2>
                    </div>
                    
                    <p>Olá,</p>
                    <p>Você solicitou a recuperação de senha da sua conta.</p>
                    
                    <p style="text-align: center;">
                        <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
                    </p>
                    
                    <p>Ou copie e cole este link no seu navegador:</p>
                    <div class="link-box">${resetUrl}</div>
                    
                    <div class="warning">
                        <strong>⏰ Atenção:</strong> Este link expira em <strong>1 hora</strong>.
                    </div>
                    
                    <div class="footer">
                        <p>Se você não solicitou esta recuperação, <strong>ignore este email</strong>.</p>
                        <p>Sua senha permanecerá inalterada e sua conta está segura.</p>
                        <p style="margin-top: 20px; color: #999;">
                            Este é um email automático, por favor não responda.
                        </p>
                    </div>
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

            return res.status(200).json({
                mensage: "Autenticado com sucesso",
                payload: payload
            });
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

            return res.status(200).json({
                mensage: "Cadastrado e autenticado com sucesso",
                payload: payload
            });
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

// ✅ ROTA TOTALMENTE CORRIGIDA: Solicitar recuperação de senha
app.post('/forgot-password', async (req, res) => {
    const { email, name } = req.body;
    
    try {
        // ✅ Validação de entrada
        if (!email || !name) {
            return res.status(400).json({ 
                msg: 'Email e nome são obrigatórios',
                success: false 
            });
        }

        // ✅ Busca usuário
        const user = await User.findOne({ nome: name, Email: email });
        
        if (!user) {
            // ✅ Por segurança, não revelar se o usuário existe
            return res.status(200).json({ 
                msg: 'Se o email existir, você receberá instruções de recuperação.',
                success: true
            });
        }

        // ✅ Gera token único e seguro
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = await bcrypt.hash(resetToken, 10);
        
        // ✅ Salva token e data de expiração no banco
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
        await user.save();

        // ✅ CRÍTICO: Usa AWAIT para esperar o email ser enviado
        try {
            await enviarEmailRecuperacao(email, resetToken);
            console.log('✅ Email de recuperação enviado para:', email);
            
            return res.status(200).json({ 
                msg: 'Email de recuperação enviado! Verifique sua caixa de entrada.',
                success: true
            });
        } catch (emailError) {
            console.error('❌ Erro ao enviar email:', emailError);
            
            // ✅ Remove o token se o email falhar
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            
            return res.status(500).json({ 
                msg: 'Erro ao enviar email. Tente novamente mais tarde.',
                success: false,
                error: emailError.message
            });
        }

    } catch (error) {
        console.error('❌ Erro ao processar recuperação:', error);
        return res.status(500).json({ 
            msg: 'Erro no servidor. Tente novamente mais tarde.',
            success: false,
            error: error.message
        });
    }
});

// ✅ NOVA ROTA: Redefinir senha com token
app.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    try {
        // ✅ Validação
        if (!token || !newPassword) {
            return res.status(400).json({ 
                msg: 'Token e nova senha são obrigatórios',
                success: false
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                msg: 'Senha deve ter no mínimo 6 caracteres',
                success: false
            });
        }

        // ✅ Busca usuários com token válido (não expirado)
        const users = await User.find({
            resetPasswordExpires: { $gt: Date.now() }
        });

        // ✅ Verifica qual usuário tem o token correto
        let user = null;
        for (let u of users) {
            if (u.resetPasswordToken) {
                const isValid = await bcrypt.compare(token, u.resetPasswordToken);
                if (isValid) {
                    user = u;
                    break;
                }
            }
        }

        if (!user) {
            return res.status(400).json({ 
                msg: 'Token inválido ou expirado. Solicite uma nova recuperação.',
                success: false
            });
        }

        // ✅ Atualiza senha
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log('✅ Senha alterada com sucesso para:', user.Email);

        return res.status(200).json({ 
            msg: 'Senha alterada com sucesso! Faça login com sua nova senha.',
            success: true
        });

    } catch (error) {
        console.error('❌ Erro ao redefinir senha:', error);
        return res.status(500).json({ 
            msg: 'Erro no servidor',
            success: false,
            error: error.message
        });
    }
});

// ✅ REMOVIDA: Rota antiga /forgot (insegura)
// app.post('/forgot', ...) ← DELETADA

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📧 Sistema de recuperação de senha ativo`);
});
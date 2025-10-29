import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import GoogleLoginSchema from "./GoogleLoginSchema.js";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));
app.use(cookieParser());

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
            email: decoded.email
        };
        req.userId = decoded.id;
        req.userName = decoded.name;
        req.userEmail = decoded.email;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token Inválido' });
    }
}

// ========================================
// ROTA: Login Tradicional
// ========================================
app.post('/api/login', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
        }

        // Buscar usuário existente
        const usuario = await User.findOne({ Email: email });

        if (usuario) {
            // Usuário existe - validar senha
            const senhaValida = await bcrypt.compare(password, usuario.password);

            if (!senhaValida) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }

            const payload = {
                id: usuario._id.toString(),
                email: usuario.Email,
                name: usuario.nome
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
            // Criar novo usuário
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
                name: novoUser.nome
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

// ========================================
// ROTA: Login com Google
// ========================================
app.post('/api/login/authGoogle', async (req, res) => {
    try {
        const { name, email, sub, picture } = req.body;

        if (!name || !email || !sub) {
            return res.status(400).json({ msg: 'Dados incompletos' });
        }

        console.log('📝 Login Google recebido:', { name, email, sub });

        // Buscar usuário pelo email OU pelo sub (Google ID)
        let googleUsuario = await GoogleLoginSchema.findOne({
            $or: [
                { userEmail: email },
                { googleId: sub }
            ]
        });

        if (googleUsuario) {
            // Usuário já existe - atualizar dados se necessário
            googleUsuario.userName = name;
            googleUsuario.userEmail = email;
            googleUsuario.googleId = sub;
            if (picture) googleUsuario.picture = picture;
            await googleUsuario.save();

            console.log('✅ Usuário Google atualizado:', googleUsuario._id);

            const googlePayload = {
                id: googleUsuario._id.toString(),
                name: googleUsuario.userName,
                email: googleUsuario.userEmail,
                googleId: googleUsuario.googleId
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
            // Criar novo usuário Google
            const newGoogleUser = await GoogleLoginSchema.create({
                userName: name,
                userEmail: email,
                googleId: sub,
                picture: picture || null
            });

            console.log('✅ Novo usuário Google criado:', newGoogleUser._id);

            const newPayloadGoogle = {
                id: newGoogleUser._id.toString(),
                name: newGoogleUser.userName,
                email: newGoogleUser.userEmail,
                googleId: newGoogleUser.googleId
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

// ========================================
// ROTA: Obter dados do usuário logado
// ========================================
app.get('/api/me', tokenVerify, async (req, res) => {
    return res.json({
        id: req.userId,
        name: req.userName,
        email: req.userEmail
    });
});

// ========================================
// ROTA: Logout
// ========================================
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
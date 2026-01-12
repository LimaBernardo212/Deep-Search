import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bycrypt from "bcrypt";
import ServicesCad from './ServiceCadSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 1202;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(express.urlencoded( { extended: true } ))
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function tokenVerify(req, res, next) {
        const token = req.cookies.authToken;
        if (!token) {
            return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
        }
        try {
            const decoded = jwt.decode(token, JWT_SECRET);
            req.user = {
                 id: decoded.id,
                 name: decoded.name,
                 email: decoded.email
                }
            req.userId = decoded.id;
            req.userEmail = decoded.email;
            req.userName = decoded.name;
            req.userIsStore = decoded.isStore;
            next();
        } catch (error) {
            return res.status(401).json({ message: "Token inválido" });
        }
}
app.get('/api/me', tokenVerify, async (req, res) => {
    if (!req.userId){
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    else{
        return res.json({ id: req.userId, email: req.userEmail, name: req.userName, isStore: req.userIsStore });
    }
})

async function connect(){
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Conectado ao MongoDB");
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        })
    }
    catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
    }
}
connect();
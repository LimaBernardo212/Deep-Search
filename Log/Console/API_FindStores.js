import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bycrypt from "bcrypt";
import StoreCad from './StoreCadschema.js';

dotenv.config();

const app = express();
const PORT = 9398;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(express.urlencoded( { extended: true } ))
app.use(cookieParser());
app.use(express.static('./public'));

async function tokenVerify(req, res, next) {
    const token = req.cookies.authToken;
    if (!token) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
             id: decoded.id,
             email: decoded.email,
             name: decoded.name
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
    }else{
        return res.json({ id: req.userId, email: req.userEmail, name: req.userName, isStore: req.userIsStore });
    }
});
  async function extrairLojas(req, res) {
      try {
          // Retorna diretamente os documentos da coleção
          const storesDB = await StoreCad.find().lean();

          if (!storesDB || storesDB.length === 0) {
              return res.status(404).json({ message: "Nenhuma loja encontrada" });
          }

          // Agora apenas os dados de StoreCad são retornados (array de documentos)
          return res.json(storesDB);
      } catch (error) {
          return res.status(500).json({ message: "Erro ao buscar lojas" });
      }
  }
app.get('/api/stores', tokenVerify, extrairLojas);


 async function connect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        app.listen(PORT, () => {
            console.log('Conectado com sucesso em http://localhost:' + PORT);
        })
            console.log('Sucesso ao conectar com o banco de dados!');
    } catch (error) {
        console.error(error);
    }
}

connect();
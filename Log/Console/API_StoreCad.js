import express from 'express';
import mongoose  from 'mongoose';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from './Loginschema.js';
import StoreCad from './StoreCadschema.js';

dotenv.config();

const app = express();
const PORT = 1234;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'));
app.use(cookieParser());

let user = [];


async function startServer(){
    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Conectado!");
        app.listen(PORT, () => {
            console.log("Servidor rodando na porta " + PORT);
        })
    } catch (error) {
        console.error("Erro ao conectar ao MongoDB:", error);
        process.exit(1);
    }
}
startServer();
function TokenVerify(req, res, next){
    const token = req.cookies.authToken;
    if(!token){
        return res.status(401).json({message: "Acesso negado. Token não fornecido."});
    }
    try {
        const decodes = jwt.verify(token, JWT_SECRET);
        req.user = {
             id: decodes.id,
            email: decodes.email,
            name: decodes.name
        };

        req.userId = decodes.id;
        req.userEmail = decodes.email;
        req.userName = decodes.name;
        req.userIsStore = decodes.isStore;
        next();
    } catch (error) {
        return res.status(401).json({message: "Token inválido"});
    }
}

app.get("/api/me", TokenVerify, async (req, res) => 
{
    if (!req.userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }
    else{
        try{
            return res.json( {
            id: req.userId,
            name: req.userName,
            email: req.userEmail,
            } )
        }
    catch(error){
        console.error("Erro ao buscar dados do usuário:", error);
        return res.status(500).json({ message: "Erro ao buscar dados do usuário" });
    }
    }
}
)
app.post('/CadNewStore', TokenVerify, async (req, res) => {
    const {id, name, email} = req.user;
    const {storeName, address, cnpj, phone, storeEmail, description} = req.body;
    if(!req.userId){
        return res.status(401).json({message: "Acesso negado. Token não fornecido."});
    }
    try {
        const newStore = await StoreCad.create({
        name: name,
        email: email,
        description: description,
        storeName: storeName,
        address: address,
        cnpj: cnpj,
        phone: phone,
        storeEmail: storeEmail
    })
     return res.status(201).json( {mensage: "Loja cadastrada com sucesso!"} )
    } catch (error) {
        return res.status(500).json({error: error})
    }
})


import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bycrypt from "bcrypt";
dotenv.config();

const app = express();
const PORT = 5000;
app.use(express.json());
app.use(express.urlencoded( { extended: true } ));
app.use(express.static("./public"));
const conectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado com sucesso :>D');
    } catch (error) {
        console.log(error);
    }
}
conectDB();


app.post('/createFormRes', async (req, res) => {
    try {
        
        const { name , email, password, isStore  } = req.body;
        const senhaHash = await bycrypt.hash(password, 10);
        console.log(email, name, password, isStore);
        if (!name || !email){
            return res.status(400).json({ error: 'Por favor, preencha todos os campos.' });
        }
    const novoUser = await User.create({
        nome: name,
        Email: email,
        password: senhaHash,
        isStore: isStore === 'on' ? true : false
    });
    
    return res.status(201).json( {mensage: "Usuario cadastrado com sucesso!"} )
    } catch (error) {
        return res.status(500).json({error: error})
    }
})
app.listen(PORT, () => {
    console.log('Observando a porta ' + PORT)
})
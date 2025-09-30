import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Venda from "./test.js";
dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());
const conectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    } catch (error) {
        console.log('ERROR:' , error);
    }
    
}
conectDB()
app.listen(PORT, () => {
    console.log(`Hello Server! You as running at ${PORT}° of my Home`)
})
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Middleware = Uma função que trata as informações recebidas
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//CREATE
app.post('/vendas', async (req, res) => {
    try {
        const NovaVenda = await Venda.create(req.body);
    res.json(NovaVenda);
    } catch (error) {
        res.json({error: error})
    }
} )
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//READ
app.get("/vendas", async (req, res) => {
    try {
        const vendasMensais = await Venda.find();
        res.json(vendasMensais);
    } catch (error) {
        res.json({error: error} )
    }
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//UPDATE
app.put("/vendas/:id", async (req, res) => {
  
    try {
        const AttVenda = await Venda.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.json(AttVenda)
    } catch (error) {
        res.json({error: error})
    }
})
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DELETE
app.delete("/vendas/:id", async (req, res) => {
    try {
        const vendaCancelada = await Venda.findByIdAndDelete(req.params.id);
        res.json(vendaCancelada)
    } catch (error) {
        res.json({error: error})
    }
})

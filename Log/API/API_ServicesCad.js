import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import StoreCad from './StoreCadschema.js';
import ServiceCad from './ServiceCadSchema.js';
dotenv.config();

const app = express();
const PORT = 2896;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(express.urlencoded( { extended: true } ));
app.use(cookieParser());
app.use(express.static('public'));

function tokenVerify(req, res, next){
    const token = req.cookies.authToken;
    if (!token){
        return res.status(401).json({ message: 'Acesso negado. Token não fornecido. Ou expirado' });
    }
    try {
        const decodes = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decodes.id,
            email: decodes.email,
            name: decodes.name
        };
        req.UserId = decodes.id;
        req.UserEmail = decodes.email;
        req.UserName = decodes.name;
        next();
    } catch (error) {
        
    }
}
app.get('/api/me', tokenVerify, async (req, res) => {
    if (!req.user){
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }else{
        return res.status(200).json( { id: req.user.id, email: req.user.email, name: req.user.name } );
    }
})

app.post('/servicesCad', tokenVerify, async (req, res) => {
    const { serviceName, serviceDesc, servicePrice } = req.body;
    const { name, email } = req.user;
    try {
        const findStore = await StoreCad.findOne({ name: name, email: email }).lean();
        if (!findStore) {
            return res.status(400).json({ message: 'Loja não encontrada para o usuário autenticado' });
        }
        const newService =  await ServiceCad.create({
            name: name,
            email: email,
            storeName: findStore.storeName,
            storeEmail: findStore.storeEmail,
            phone: findStore.phone,
            serviceName: serviceName,
            serviceDesc: serviceDesc,
            servicePrice: servicePrice
        });
        res.status(201).json({ message: 'Serviço cadastrado com sucesso', service: newService })
    } catch (error) {
        return res.status(500).json({ message: 'Fatal error, machine compromised, abandon this machine immediately before they steal your Makita. ', error: error.message });
    }
})
async function connect() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado ao MongoDB');
        app.listen(PORT, () => {
            console.log('Rodando em http://localhost:' + PORT);
        })
    } catch (error) {
        console.log('Erro ao conectar ao MongoDB:', error);
    }
}
connect();

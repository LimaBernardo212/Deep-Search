import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import StoreCad from './StoreCadschema.js';
import HoursStorage from './HourSchema.js';

dotenv.config();

const app = express();
const PORT = 5732;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definido no .env');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI não definido no .env');
  process.exit(1);
}

// Middleware de verificação de token via cookie "authToken"
function tokenVerify(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Acesso negado. Token não fornecido. Ou expirado' });
  }
  try {
    const decodes = jwt.verify(token, JWT_SECRET);
    req.user = { id: decodes.id, email: decodes.email, name: decodes.name };
    req.UserId = decodes.id;
    req.UserEmail = decodes.email;
    req.UserName = decodes.name;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido (┬┬﹏┬┬)' });
  }
}

app.get('/api/me', tokenVerify, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Usuário não autenticado' });
  try {
    return res.status(200).json({ id: req.user.id, email: req.user.email, name: req.user.name });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Validação simples para HH:MM 24h
function isValidHour(h) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
}

app.post('/horarioCad', tokenVerify, async (req, res) => {
  try {
    const { name, email } = req.user;
    const { hideHour, hour } = req.body;

    const store = await StoreCad.findOne({ name, email }).lean();
    if (!store) {
      return res.status(404).json({ message: 'Loja não encontrada' });
    }

    // hour pode ser string ou array
    const raw = hour;
    const hours = Array.isArray(raw) ? raw : raw ? [raw] : [];

    // Normaliza, remove vazios, valida e deduplica
    const normalized = hours.map((h) => String(h).trim()).filter(Boolean);
    const invalid = normalized.filter((h) => !isValidHour(h));
    if (invalid.length) {
      return res.status(400).json({ message: 'Horário(s) inválido(s)', invalid });
    }
    const uniqueHours = [...new Set(normalized)];

    // Salva como array no model HoursStorage
    const created = await HoursStorage.create({
      storeName: store.storeName,
      storeEmail: store.storeEmail,
      phone: store.phone,
      hour: uniqueHours,
    });

    return res.status(201).json({
      message: 'Horários cadastrados com sucesso',
      store: {
        storeName: store.storeName,
        storeEmail: store.storeEmail,
        phone: store.phone,
      },
      hours: created.hour,
      hideHour,
      id: created._id,
      createdAt: created.createdAt,
    });
  } catch (error) {
    console.error('Erro em /horarioCad:', error);
    return res.status(500).json({ message: 'Erro no servidor' });
  }
});

async function conenctDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');
    app.listen(PORT, () => {
      console.log('Conectado em http://localhost:' + PORT);
    });
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
}
conenctDB();
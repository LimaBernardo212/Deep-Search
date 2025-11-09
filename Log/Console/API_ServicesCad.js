import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';


import StoreCad from './StoreCadschema.js';
import ServicesCad from './ServiceCadSchema.js';

dotenv.config();

const app = express();
const PORT = 2896;
const JWT_SECRET = process.env.JWT_SECRET;

// Raízes de upload e estáticos


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));


// Multer em memória para processar com Sharp


// Handler de erro do multer/geral (evita 500 silencioso em erro de upload)




/**
 * Redimensiona e converte a imagem para WebP.
 */

/**
 * Salva o Buffer no disco e retorna caminhos/nomes.
 */


/**
 * Middleware simples para verificar token de autenticação via cookie.
 */
function tokenVerify(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido ou expirado.' });
  }
  try {
    const decodes = jwt.verify(token, JWT_SECRET);
    req.user = { id: decodes.id, email: decodes.email, name: decodes.name };
    req.UserId = decodes.id;
    req.UserEmail = decodes.email;
    req.UserName = decodes.name;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

// Endpoint para retornar dados básicos do usuário autenticado
app.get('/api/me', tokenVerify, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Usuário não autenticado' });
  }
  return res
    .status(200)
    .json({ id: req.user.id, email: req.user.email, name: req.user.name });
});

// Normaliza preço aceitando vírgula como separador decimal
function normalizePrice(v) {
  if (v === undefined || v === null) return 0;
  const s = String(v).replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Cadastro de serviços
 * Aceita múltiplos serviços via arrays:
 * - serviceName[] / serviceName
 * - serviceDesc[] / serviceDesc
 * - servicePrice[] / servicePrice
 * Imagens: qualquer campo de arquivo (não filtramos por nome)
 */


async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado ao MongoDB');

    // Garante diretórios de upload ao iniciar
    await ensureUploadsDir();

    app.listen(PORT, () => {
      console.log('Rodando em http://localhost:' + PORT);
      console.log('Uploads servidos em http://localhost:' + PORT + '/uploads');
    });
  } catch (error) {
    console.log('Erro ao conectar ao MongoDB:', error);
  }
}

connect();
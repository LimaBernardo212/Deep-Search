import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

import StoreCad from './StoreCadschema.js';
import ServicesCad from './ServiceCadSchema.js';

dotenv.config();

const app = express();
const PORT = 2896;
const JWT_SECRET = process.env.JWT_SECRET;

// Raízes de upload e estáticos
const UPLOADS_ROOT = path.resolve('uploads');
const SERVICES_UPLOADS_DIR = path.join(UPLOADS_ROOT, 'services');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));
app.use('/uploads', express.static(UPLOADS_ROOT));

// Multer em memória para processar com Sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    const okTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'image/heic',
      'image/heif'
    ];
    if (okTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error('Tipo de arquivo inválido. Apenas imagens são permitidas.'));
  }
});

// Handler de erro do multer/geral (evita 500 silencioso em erro de upload)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: 'Erro de upload', error: err.message });
  }
  if (err) {
    return res.status(400).json({ message: 'Erro na requisição', error: err.message });
  }
  return next();
});

async function ensureUploadsDir() {
  try {
    await fs.mkdir(SERVICES_UPLOADS_DIR, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório de uploads:', error);
    throw error;
  }
}

/**
 * Redimensiona e converte a imagem para WebP.
 */
async function processImageToWebp(
  buffer,
  { maxWidth = 1024, maxHeight = 1024, quality = 80 } = {}
) {
  const pipeline = sharp(buffer, { failOn: 'none' }).rotate(); // corrige orientação EXIF
  const webpBuffer = await pipeline
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toBuffer();

  const meta = await sharp(webpBuffer).metadata();
  return {
    buffer: webpBuffer,
    format: 'webp',
    width: meta.width,
    height: meta.height,
    sizeBytes: webpBuffer.length
  };
}

/**
 * Salva o Buffer no disco e retorna caminhos/nomes.
 */
async function saveBufferToDisk(buffer, ext = 'webp') {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = path.join(SERVICES_UPLOADS_DIR, fileName);
  await fs.writeFile(filePath, buffer);
  return { fileName, absPath: filePath, relPath: `/uploads/services/${fileName}` };
}

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
app.post('/servicesCad', tokenVerify, upload.any(), async (req, res) => {
  try {
    await ensureUploadsDir();

    // Debug dos campos recebidos
    console.log('Body keys:', Object.keys(req.body));
    console.log(
      'Files:',
      (req.files || []).map((f, idx) => ({
        idx,
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size
      }))
    );

    const { name, email } = req.user;

    const findStore = await StoreCad.findOne({ name, email }).lean();
    if (!findStore) {
      return res.status(400).json({ message: 'Loja não encontrada para o usuário autenticado' });
    }

    // Normalização de arrays (suporta envio simples ou em lista)
    const toArray = (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : []);

    const serviceNames = toArray(req.body['serviceName[]'] ?? req.body.serviceName);
    const serviceDescs = toArray(req.body['serviceDesc[]'] ?? req.body.serviceDesc);
    const servicePricesRaw = toArray(req.body['servicePrice[]'] ?? req.body.servicePrice);

    // Todos os arquivos, na ordem que chegaram do form
    const files = req.files || [];

    // Quantidade total de linhas a processar
    const total = Math.max(serviceNames.length, serviceDescs.length, servicePricesRaw.length) || 0;
    if (total === 0 && !serviceNames.length && !serviceDescs.length && !servicePricesRaw.length) {
      return res.status(400).json({ message: 'Nenhum serviço enviado.' });
    }

    const created = [];
    let fileCursor = 0; // CURSOR SEQUENCIAL DE ARQUIVOS

    for (let i = 0; i < Math.max(total, 1); i++) {
      const sName =
        serviceNames[i] ?? serviceNames[0] ?? req.body.serviceName ?? '';
      const sDesc =
        serviceDescs[i] ?? serviceDescs[0] ?? req.body.serviceDesc ?? '';
      const price = normalizePrice(
        servicePricesRaw[i] ?? servicePricesRaw[0] ?? req.body.servicePrice ?? '0'
      );

      // Ignora entradas sem nome
      if (!sName) continue;

      // Usa o PRÓXIMO arquivo disponível, sem indexar por i
      let fileUsedIndex = null;
      let file = null;

      if (fileCursor < files.length) {
        file = files[fileCursor];
      }

      let imageInfo = null;
      if (file?.buffer) {
        try {
          const processed = await processImageToWebp(file.buffer, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 80
          });

          const saved = await saveBufferToDisk(processed.buffer, processed.format);
          imageInfo = {
            storage: 'disk',
            path: saved.relPath,
            filename: saved.fileName,
            format: processed.format,
            width: processed.width,
            height: processed.height,
            sizeBytes: processed.sizeBytes
          };

          // Só avança o cursor SE o arquivo foi processado com sucesso
          fileUsedIndex = fileCursor;
          fileCursor++;
        } catch (imgErr) {
          console.warn('Falha ao processar imagem do serviço index', i, imgErr.message);
          // Não avança o cursor em caso de falha para tentar usar o mesmo arquivo no próximo loop? -> aqui NÃO avançamos; se o arquivo está corrompido, avançar evitaria loop infinito; então avance:
          fileCursor++;
        }
      }

      const newService = await ServicesCad.create({
        name: name,
        email: email,
        storeName: findStore.storeName,
        storeEmail: findStore.storeEmail,
        phone: findStore.phone,
        serviceName: sName,
        serviceDesc: sDesc,
        servicePrice: price,
        serviceImagePath: imageInfo?.path ?? null,
        serviceImageMeta: imageInfo ?? null
      });

      created.push({
        ...newService.toObject(),
        _debugFileUsedIndex: fileUsedIndex // ajuda a debugar alinhamento
      });
    }

    if (created.length === 0) {
      return res.status(400).json({ message: 'Nenhuma entrada válida de serviço para cadastrar.' });
    }

    console.log(`Criados ${created.length} serviço(s). files.length=${files.length}`);
    return res.status(201).json({
      message: 'Serviço(s) cadastrado(s) com sucesso',
      count: created.length,
      services: created
    });
  } catch (error) {
    console.error('Erro ao cadastrar serviços:', error);
    return res.status(500).json({
      message: 'Erro ao processar o cadastro de serviços.',
      error: error.message
    });
  }
});

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
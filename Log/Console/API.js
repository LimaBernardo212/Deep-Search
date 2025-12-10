import express from "express";
import dotenv from "dotenv";
import mongoose, { model } from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import path from "path";
import nodemailer from "nodemailer";
import crypto from "crypto"; // ← Adicione isso
import { fileURLToPath } from "url";
import coding from "./codeSchema.js";
import StoreCad from "./StoreCadschema.js";
import ServicesCad from "./ServiceCadSchema.js";
import multer from "multer";
import sharp from "sharp";
import fs from "fs/promises";
import HoursStorage from "./HourSchema.js";
import { count } from "console";
import HourSchema from "./HourSchema.js";
import scheduleSchema from "./scheduleSchema.js";
dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_ROOT = path.resolve("uploads");
const SERVICES_UPLOADS_DIR = path.join(UPLOADS_ROOT, "services");
const STORES_UPLOADS_DIR = path.join(UPLOADS_ROOT, "stores");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("./public"));
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_ROOT));
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res
      .status(400)
      .json({ message: "Erro de upload", error: err.message });
  }
  if (err) {
    return res
      .status(400)
      .json({ message: "Erro na requisição", error: err.message });
  }
  return next();
});

// ✅ CORRIGIDO: Transporter com SSL configurado
var transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "d357f63add29f7",
    pass: "fc32811f387516",
  },
});
// ✅ Testa conexão ao iniciar
transport.verify((error, success) => {
  if (error) {
    console.error("❌ Erro na configuração do email:", error.message);
  } else {
    console.log("✅ Servidor de email pronto para enviar mensagens");
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB por arquivo
  },
  fileFilter: (req, file, cb) => {
    const okTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
      "image/heic",
      "image/heif",
    ];
    if (okTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new Error("Tipo de arquivo inválido. Apenas imagens são permitidas.")
    );
  },
});

// Conectar ao MongoDB
const conectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Conectado ao MongoDB com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao conectar MongoDB:", error);
  }
};
conectDB();

// Middleware de verificação de token
function tokenVerify(req, res, next) {
  const token = req.cookies.authToken;

  if (!token) {
    return res.status(401).json({ error: "Acesso Negado" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      itsNew: decoded.itsNew,
    };
    req.userId = decoded.id;
    req.userName = decoded.name;
    req.userEmail = decoded.email;
    req.itsNew = decoded.itsNew;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token Inválido" });
  }
}

// ✅ NOVA FUNÇÃO: Enviar email de recuperação COM TOKEN
async function enviarEmailRecuperacao(email, resetToken) {
  const resetUrl = `http://localhost:3000/reset-password.html`;

  const emailOptions = {
    from: "bernardolimarodrigues4@gmail.com",
    to: email,
    subject: "Password recovery",
    html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        
                        background-color: #0D0D0D;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                    .container { 
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        padding: 20px;
                        background-color: transparent;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .GreenCard{
    color: #238C6E;
    font-family: Arial, Helvetica, sans-serif;
}
                    .pointer{
    width: 3vw;
    height: 3vh;
   
    margin-left: 5px;
    font-family: Arial, Helvetica, sans-serif;
    background-color: #f2f2f2;
    color: #f2f2f2;
    animation-name: pisk;
    animation-duration: 0.7s;
    animation-iteration-count: infinite;
    animation-timing-function: steps(1);
    
}
@keyframes pisk {
    0%{
        opacity: 0;
    }
    50%{
        opacity: 1;
    }
    100%{
        opacity: 0;
    }
    
}

                    .header {
                        text-align: center;
                        padding: 20px 0;
                        color: #f2f2f2;
                        font-family: Arial, Helvetica, sans-serif;
                        border-bottom: 2px solid #238C6E;
                        margin-bottom: 20px;
                    }
                    
                    
                    .link-box {
                        background-color: #238C6E;
                        padding: 10px;
                        border-radius: 5px;
                        word-break: break-all;
                        font-size: 12px;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        color: #f2f2f2;
                    }
                    .container p{
                        color: #f2f2f2;
                        margin: 5px;
                        font-family: Arial, Helvetica, sans-serif;
                    }
                    #diferent{
                        margin: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Password <strong class="GreenCard">Recovery</strong><strong class="pointer">||</strong></h2>
                    </div>
                    
                    <p>Hi,</p>
                    <p>How are you?</p>
                    
                    <p>
                        You requested a password reset at https://log.bussiness
                    </p>
                    
                    <p id="diferent">Paste the code below on our website and reset your password:</p>
                    <div class="link-box">${resetToken}</div>
                    
                </div>
            </body>
            </html>
        `,
  };

  // ✅ IMPORTANTE: Retorna a Promise para poder tratar erros
  return await transport.sendMail(emailOptions);
}
async function createPostRoute(storeName) {
  app.get(`/store/${storeName}`, async (req, res) => {
    res.sendFile(path.join(__dirname, "public", "base.html"));
  });
  app.get(`/api/store/${storeName}`, async (req, res) => {
    const realStoreName = storeName.replaceAll("_", "/");
    const trueName = realStoreName.replaceAll("/", " ");
    try {
      const storeData = await StoreCad.findOne({ storeName: realStoreName });
      if (!storeData) {
        return res.status(404).json({ error: "Not found" });
      }

      const servicesData = await ServicesCad.find({
        storeName: realStoreName,
      }).lean();
      if (!servicesData || servicesData.length == 0) {
        return res.status(404).json({ error: "Services not found" });
      }
      let htmlArray = [];
      let count = 0;
      const serviceName = servicesData.map((doc) => doc.serviceName).flat();
      const imgPath = storeData.storeImagePath;
      for (let i = 0; i < servicesData.length; i++) {
        const servicesDoc = servicesData[i];
        const names = servicesDoc.serviceName;
        const desc = servicesDoc.serviceDesc;
        const prices = servicesDoc.servicePrice;
        const imgPath2 = servicesDoc.serviceImagePath;

        for (let j = 0; j < names.length; j++) {
          let structure = `
                <div class="Service">
                
            <div class="imageService"><img src="${imgPath2[j]}" alt=""></div>
            <div class="servicesInfos">
              <h1>${names[j]}</h1>
              <p>${desc[j]}</p>
              <h2>${prices[j]}</h2>
            </div>
            <div class="scheduleButton">
              <button class="scheduleBtn">
                Schedule now
              </button>
                   </div>
        </div>`;
          count++;
          htmlArray.push(structure);
        }
      }

      let servicesReturner = htmlArray.join("");
      let returnS = servicesReturner + "</section>";
      let htmlBasePageModel3 = `<header class="nb">
        <button class="nButton" id="back">
            <img src="https://img.icons8.com/?size=100&id=99996&format=png&color=FFFFFF" alt="">
        </button>
    </header>
    
    <section class="all-stores-info">
      <section class="storeGrandSect">
          <div class="storeData">
            <div class="imgData"><img src="${imgPath}" alt=""></div>
            <div class="infoData">
              <h1>${trueName}</h1>
              <p><strong class="consoleWrite">>_</strong>${storeData.description}</p>
              <div class="hours">
                <div class="openAt">${storeData.openHours}</div>
                <div class="theHourLine"></div>
                <div class="closeAt">${storeData.closedHours}</div>
              
              <div class="functionDays"><div class="placeholder">Closed on days:</div><div class="until">${storeData.closedDays}</div></div>
              </div>
              <button class="servicesBtn">Schedule Now</button>
            </div>
          </div>
          
      </section>
      <!--SOMOS DIFERENTES DIVS-->
      <section class="services-content" id="forScrollPreguiçosos">
      ${returnS}
      
    </section>
    <footer class="selectedIndicator"><span class="counter">Selected services: </span><button>Next<strong class="consoleWrite"> >></strong></button></footer>
        `;
      return res.status(200).json({
        htmlPage: htmlBasePageModel3,
        services: servicesData,
        store: storeData,
        StoreName: trueName,
        serviceName: serviceName,
        closedDays: storeData.closedDays,
        returner: returnS,
      });
    } catch (error) {
      return res.status(500).json({ error: "Server error" });
    }
  });
  return true;
}
async function ensureUploadsDir() {
  try {
    await fs.mkdir(SERVICES_UPLOADS_DIR, { recursive: true });
    await fs.mkdir(STORES_UPLOADS_DIR, { recursive: true }); // ✅ CRIAR AMBOS
  } catch (error) {
    console.error("Erro ao criar diretório de uploads:", error);
    throw error;
  }
}
async function processImageToWebp(
  buffer,
  { maxWidth = 1024, maxHeight = 1024, quality = 80 } = {}
) {
  const pipeline = sharp(buffer, { failOn: "none" }).rotate(); // corrige orientação EXIF
  const webpBuffer = await pipeline
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();

  const meta = await sharp(webpBuffer).metadata();
  return {
    buffer: webpBuffer,
    format: "webp",
    width: meta.width,
    height: meta.height,
    sizeBytes: webpBuffer.length,
  };
}

async function saveBufferToDisk(buffer, ext = "webp", type = "service") {
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  // ✅ Escolher diretório baseado no tipo
  const uploadDir =
    type === "store" ? STORES_UPLOADS_DIR : SERVICES_UPLOADS_DIR;
  const urlPath = type === "store" ? "stores" : "services";

  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    absPath: filePath,
    relPath: `/uploads/${urlPath}/${fileName}`, // ✅ Caminho dinâmico
  };
}
// ========================================
// SUAS ROTAS DE LOGIN (permanecem iguais)
// ========================================
app.post("/api/login", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Por favor, preencha todos os campos." });
    }

    const usuario = await User.findOne({  nome: name, Email: email });

    if (usuario) {
      const senhaValida = await bcrypt.compare(password, usuario.password);

      if (!senhaValida) {
        return res.status(401).json({ error: "Credenciais inválidas, tente login com Google" });
      }

      const payload = {
        id: usuario._id.toString(),
        email: usuario.Email,
        name: usuario.nome,
        itsNew: false,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.redirect("/home.html");
    } else {
      const senhaHash = await bcrypt.hash(password, 10);

      const novoUser = await User.create({
        nome: name,
        Email: email,
        password: senhaHash,
        isStore: false,
      });

      const payload = {
        id: novoUser._id.toString(),
        email: novoUser.Email,
        name: novoUser.nome,
        itsNew: true,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

      res.cookie("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.redirect("/home.html");
    }
  } catch (error) {
    console.error("❌ Erro em /api/login:", error);
    return res.status(500).json({ error: "Erro no servidor" });
  }
});

app.post("/api/login/authGoogle", async (req, res) => {
  try {
    const { name, email, sub } = req.body;

    if (!name || !email || !sub) {
      return res.status(400).json({ msg: "Dados incompletos" });
    }

    console.log("📝 Login Google recebido:", { name, email, sub });

    let googleUsuario = await User.findOne({ nome: name, Email: email });

    if (googleUsuario) {
      googleUsuario.nome = name;
      googleUsuario.Email = email;
      googleUsuario.id = sub;

      const googlePayload = {
        id: googleUsuario._id.toString(),
        nome: googleUsuario.nome,
        Email: googleUsuario.Email,
        itsNew: false,
      };

      const googleToken = jwt.sign(googlePayload, JWT_SECRET, {
        expiresIn: "30d",
      });

      res.cookie("authToken", googleToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        msg: "Sucesss",
        payload: googlePayload,
      });
    } else {
      const newGoogleUser = await User.create({
        nome: name,
        Email: email,
        password: "Not shared with us",
      });

      console.log("✅ Novo usuário Google criado:", newGoogleUser._id);

      const newPayloadGoogle = {
        id: newGoogleUser._id.toString(),
        name: newGoogleUser.nome,
        email: newGoogleUser.Email,
        itsNew: true,
      };

      const newGoogleUserToken = jwt.sign(newPayloadGoogle, JWT_SECRET, {
        expiresIn: "30d",
      });

      res.cookie("authToken", newGoogleUserToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        msg: "SUPER SUCESS",
        payload: newPayloadGoogle,
      });
    }
  } catch (error) {
    console.error("❌ Erro em /api/login/authGoogle:", error);
    return res.status(500).json({
      msg: "ERROR",
      error: error.message,
    });
  }
});

app.get("/api/me", tokenVerify, async (req, res) => {
  return res.json({
    id: req.userId,
    name: req.userName,
    email: req.userEmail,
  });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.status(200).json({
    mensage: "Logout efetuado com sucesso",
  });
});

app.get("/verifyItsNewUser", tokenVerify, (req, res) => {
  const novo = Boolean(req.user.itsNew);
  const file = novo ? "home.html" : "home.html";
  res.sendFile(path.join(__dirname, "public", file));
});
function generateCode() {
  const coder = crypto.randomBytes(Math.ceil(6 / 2));
  let codigo = coder.toString("hex").slice(0, 6);
  return codigo;
}
// ✅ ROTA TOTALMENTE CORRIGIDA: Solicitar recuperação de senha
app.post("/forgot-password", async (req, res) => {
  const { request_email, request_name } = req.body;
  try {
    console.log(`${request_name}, ${request_email}`)
    const finder = await User.findOne({nome: request_name, Email: request_email });
    if (!finder) {
      return res.status(404).json({ error: "User don't registred in DB" });
    }
    let codet = generateCode();
    if (!codet) {
      return res
        .status(500)
        .json({ mensage: "Erro in generate the requester code" });
    }
    const registerCode = await coding.create({
      nome: request_name,
      email:  request_email,
      code: codet,
    });
    if (!registerCode) {
      return res.status(500).json({ error: "Error in cad. the code" });
    }
    await enviarEmailRecuperacao(request_email, codet);
    res.redirect("forgot.html");
  } catch (error) {
    return res.status(500).json({ mensage: "Error in the route :<" });
  }
});
app.post("/sending-password", async (req, res) => {
  const { first, second, third, fourth, fifth, sixth } = req.body;
  try {
    let hashira = `${first}${second}${third}${fourth}${fifth}${sixth}`;
    const verifyCode = await coding.findOne({ code: hashira });
    if (!verifyCode) {
      return res.redirect("forgot.html");
    }
    res.redirect("mypassword.html");
  } catch (error) {
    return res.status(500).json({ error: "Fatal Error" });
  }
});
app.post("/update-password", async (req, res) => {
  const { name, email, newpassword } = req.body;
  try {
    const hashPassword = await bcrypt.hash(newpassword, 10);
    const updater = await User.findOneAndUpdate(
      { nome: name, Email: email },
      { password: hashPassword }
    );
    if (!updater) {
      return res.status(404).json({ error: "User not find" });
    }
    const deleteCode = await coding.findOneAndDelete({
      nome: name,
      email: email,
    });
    if (!deleteCode) {
      return res
        .status(500)
        .json({ error: "We were unable to delete the code." });
    }
    const datas = await User.findOne({ nome: name, Email: email });
    if (!datas) {
      return res.status(404).json({ error: "User not find" });
    }
    const passwordPayload = {
      id: datas.id,
      name: datas.nome,
      email: datas.Email,
      itsNew: false,
    };
    const passwordToken = jwt.sign(passwordPayload, JWT_SECRET, {
      expiresIn: "30d",
    });
    res.cookie("authToken", passwordToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    res.redirect('home.html')
  } catch (error) {
    return res.status(500).json({ error: "ERROR" });
  }
});
app.post("/return/data", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const also = req.body;
  try {
    const findAllStores = await StoreCad.find();
    if (!findAllStores) {
      return res.sendStatus(404).json({ error: "Error 404" });
    }
    const storesNames = findAllStores.map((store) => store.storeName);
    const storesNum = findAllStores.length;
    let counter = 0;

    const returner = [];

    for (let i = 0; i < storesNum; i++) {
      const htmlStructure = `<div class="store">
                        <div class="juntos">
                            <div id="img">
                                <img src="${
                                  findAllStores[counter].storeImagePath
                                }" alt="">
                            </div>
                            <div id="storeinfos">
                                <p id="storename"><strong class="GreenCard">&lt;/</strong>${findAllStores[
                                  counter
                                ].storeName.replaceAll(
                                  "/",
                                  " "
                                )}<strong class="GreenCard">/></strong></p>
                                <p id="storeDescription">${
                                  findAllStores[counter].description
                                }</p>
                            </div>
                        </div>
                        <div id="moreinfos">
                            <button>
                                <img src="https://img.icons8.com/?size=100&id=85501&format=png&color=FFFFFF" alt="">
                            </button>
                        </div>
                    </div>`;
      counter++;
      returner.push(htmlStructure);
    }
    return res.status(200).json({
      return: returner,
      closedHour: findAllStores.map((store) => store.closedHours),
      closedDays: findAllStores.map((store) => store.closedHours),
      openHours: findAllStores.map((store) => store.openHours),
      storeName: storesNames,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error in the server :<" });
  }
});
app.post("/CadNewStore", tokenVerify, upload.any(), async (req, res) => {
  try {
    await ensureUploadsDir();

    console.log("Body keys:", Object.keys(req.body));
    console.log(
      "Files:",
      (req.files || []).map((f, idx) => ({
        idx,
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      }))
    );

    const { id, name, email } = req.user;
    const {
      storeName,
      address,
      cnpj,
      phone,
      storeEmail,
      description,
      closedHours,
      closedDays,
      openHours,
      pin
    } = req.body;
    // Validação básica
    if (!storeName || !address || !cnpj || !phone || !storeEmail) {
      return res.status(400).json({
        error: "Campos obrigatórios faltando",
      });
    }
    const storeNamer = storeName.replaceAll(" ", "/");
    // Verificar duplicação
    const existingStore = await StoreCad.findOne({ storeName });
    if (existingStore) {
      return res.status(400).json({
        error: "Já existe uma loja com este nome",
      });
    }

    // ✅ Processar imagem da loja
    let imageInfo = null;
    const storeImageFile = (req.files || []).find(
      (f) => f.fieldname === "storeImage"
    );

    console.log("📸 Arquivo de imagem encontrado:", !!storeImageFile);

    if (storeImageFile?.buffer) {
      try {
        const processed = await processImageToWebp(storeImageFile.buffer, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 80,
        });

        // ✅ PASSAR "store" COMO TERCEIRO PARÂMETRO
        const saved = await saveBufferToDisk(
          processed.buffer,
          processed.format,
          "store"
        );

        imageInfo = {
          storage: "disk",
          path: saved.relPath,
          filename: saved.fileName,
          format: processed.format,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        };

        console.log("✅ Imagem processada e salva em:", saved.relPath);
      } catch (imgErr) {
        console.error("❌ Falha ao processar imagem da loja:", imgErr);
        // Continua sem imagem
      }
    } else {
      console.log("⚠️ Nenhuma imagem enviada para a loja");
    }

    // Criar loja no banco
    const newStore = await StoreCad.create({
      name: name,
      email: email,
      description: description || "",
      closedHours: closedHours || "",
      closedDays: closedDays || "",
      openHours: openHours || "",
      model: pin,
      storeName: storeNamer,
      address: address,
      cnpj: cnpj,
      phone: phone,
      storeEmail: storeEmail,
      storeImagePath: imageInfo?.path ?? null,
      storeImageMeta: imageInfo ?? null,
    });

    console.log("✅ Loja cadastrada:", newStore._id);
    console.log("📁 Imagem salva em:", imageInfo?.path || "sem imagem");

    return res.redirect( "/services/register")
  } catch (error) {
    console.error("❌ Erro ao cadastrar loja:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        error: "Loja com dados duplicados",
        details: error.message,
      });
    }

    return res.status(500).json({
      error: "Erro ao cadastrar loja",
      details: error.message,
    });
  }
});
app.post("/store/page", async (req, res) => {
  const { storeName } = req.body;
  const storeNamer = storeName.replaceAll("/", "_");
  try {
    await createPostRoute(storeNamer);
    return res.status(200).json({
      message: "Rota criada com sucesso!", // ERRO: "mensage" → "message"
      redirect: `/store/${storeNamer}`,
      redirectTwo: `/api/store/${storeNamer}`,
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar a rota." });
  }
});

app.post("/servicesCad", tokenVerify, upload.any(), async (req, res) => {
  try {
    await ensureUploadsDir();

    console.log("Body keys:", Object.keys(req.body));
    console.log(
      "Files:",
      (req.files || []).map((f, idx) => ({
        idx,
        fieldname: f.fieldname,
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      }))
    );

    const { name, email } = req.user;

    const findStore = await StoreCad.findOne({ email: email });
    if (!findStore) {
      console.log(name, email);
      return res.status(400).json({
        message: "Loja não encontrada para o usuário autenticado",
        name: name,
        email: email,
      });
    }
    const toArray = (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : []);

    const serviceNames = toArray(
      req.body["serviceName[]"] ?? req.body.serviceName
    );
    const serviceDescs = toArray(
      req.body["serviceDesc[]"] ?? req.body.serviceDesc
    );
    const servicePricesRaw = toArray(
      req.body["servicePrice[]"] ?? req.body.servicePrice
    );

    const files = req.files || [];

    const total =
      Math.max(
        serviceNames.length,
        serviceDescs.length,
        servicePricesRaw.length
      ) || 0;

    if (
      total === 0 &&
      !serviceNames.length &&
      !serviceDescs.length &&
      !servicePricesRaw.length
    ) {
      return res.status(400).json({ message: "Nenhum serviço enviado." });
    }

    const created = [];
    let fileCursor = 0;
    let fileUsedIndex = null;
    let file = null;
    const imagePaths = [];
    const imageMeta = [];
    let imageInfo = null;

    for (let i = 0; i < files.length; i++) {
      if (fileCursor < files.length) {
        file = files[fileCursor];
      }

      try {
        const processed = await processImageToWebp(file.buffer, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 80,
        });

        const saved = await saveBufferToDisk(
          processed.buffer,
          processed.format,
          "service"
        );
        imageInfo = {
          storage: "disk",
          path: saved.relPath,
          filename: saved.fileName,
          format: processed.format,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        };
        fileCursor++;
        imagePaths.push(saved.relPath);
        imageMeta.push(imageInfo);
      } catch (imgErr) {
        console.warn("Falha ao processar imagem do serviço:", imgErr.message); // ERRO: removido "i" que não existe
        fileCursor++;
      }
    }

    const newService = await ServicesCad.create({
      name: name,
      email: email,
      storeName: findStore.storeName,
      storeEmail: findStore.storeEmail,
      phone: findStore.phone,
      serviceName: serviceNames,
      serviceDesc: serviceDescs,
      servicePrice: servicePricesRaw,
      serviceImagePath: imagePaths ?? null,
      serviceImageMeta: imageMeta ?? null,
    });
    created.push({
      ...newService.toObject(),
      _debugFileUsedIndex: fileUsedIndex,
    });

    if (created.length === 0) {
      return res
        .status(400)
        .json({ message: "Nenhuma entrada válida de serviço para cadastrar." });
    }

    console.log(
      `Criados ${created.length} serviço(s). files.length=${files.length}`
    );
    return res.redirect("/hour/register")
  } catch (error) {
    console.error("Erro ao cadastrar serviços:", error);
    return res.status(500).json({
      message: "Erro ao processar o cadastro de serviços.",
      error: error.message,
    });
  }
});
app.get("/stores/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "stores.html"));
});
app.post("/api/selected/fun", tokenVerify, async (req, res) => {
  const { services, storeName } = req.body;
  let servicesArray = [];
  const cstoreName = storeName.replaceAll(" ", "/");
  let counter = 0;
  const imageFinder = await ServicesCad.findOne({ storeName: cstoreName });
  if (imageFinder) {
    const imagePath = imageFinder.serviceImagePath;
    for (let i = 0; i < services.length; i++) {
      const baseStructureOfServices = `<br><div class="unionring"><img src="${imagePath[counter]}" class="imageSelected"><div class="OnSelectedServices"><p class="counterParagrafh">${services[counter]}</p></div></div>`;
      counter++;
      servicesArray.push(baseStructureOfServices);
    }
    console.log(storeName);
  } else {
    return res
      .status(404)
      .json({ error: "Error 404, serviceImageNotFound :):(:>:<" });
  }
  const findInDB = await StoreCad.findOne({ storeName: cstoreName }).lean();
  if (!findInDB) {
    return res.status(404).json({
      mensage: "ERRROR 404, store not found or error in my code, also :(",
    });
  }
  const nameOfFunctionarys = findInDB.functionary;
  let c = 0;
  let functionarysArray = [];
  for (let i = 0; i < nameOfFunctionarys.length; i++) {
    const moreBase = `<br><div class="functionaryBaseDiv" name-of="${nameOfFunctionarys[c]}"><div class="uniondivers">
      <div class="imageFunctionary"><img src="/img/().png"></div><div class="nameOfFunctionary">
        <p>${nameOfFunctionarys[c]}</p>
      </div>
    </div><div class="functionaryMore">
    <button>
        <img src="https://img.icons8.com/?size=100&id=85501&format=png&color=FFFFFF" alt="">
    </button>
          </div>
                            </div>`;
    c++;
    functionarysArray.push(moreBase);
  }

  const functionaryJoin = functionarysArray.join("");
  const servicesJoin = servicesArray.join("");
  const code = `<section class="hoursSistem">
    <div class="informationsRedered">
    <div class="renderedLabel">Your Selected <strong class="GreenCard">Services</strong><strong class="pointer">|</strong></div>
      <div class="renderedServices">${servicesJoin}</div>
      <div class="renderedLabel"><strong class="consoleWrite">>></strong>Now choose a professional partner to <strong class="GreenCard">proceed</strong>.</div><div class="renderedFunctionarys">${functionaryJoin}</div> 
    </div>
  </section>
  <footer class="selectedIndicatorA"  id="finished"><button>Next<strong class="consoleWrite"> >></strong></button></footer>`;

  return res.json({
    returner: services,
    name: storeName,
    code: code,
    functionarysName: nameOfFunctionarys,
  });
});
app.post("/api/selected/hours", tokenVerify, async (req, res) => {
  const {name, email} = req.user;
  const {storeName, functionary, day} = req.body;
  const cstoreName = storeName.replaceAll(" ", "/");
  try {
    
  const hours = await HoursStorage.findOne({ storeName: cstoreName }).lean();
  if (!hours) {
    return res
      .status(404)
      .json({ mensage: "ERROR 404, HOURS NOT FOUND (┬┬﹏┬┬)" });
  }
  const hoursTobeDiv = hours.hour;
  let cc = 0;
  let hoursArray = [];
  const reqScheudle = await scheduleSchema.find({ storeName: cstoreName, functionary: functionary, day: day})
  const scheduledHours = reqScheudle.map(schedule => schedule.hour);
  
    
    for (let i = 0; i < hoursTobeDiv.length; i++) {
      
      if (!scheduledHours.includes(hoursTobeDiv[i])){
        const outlierBase = `<br><div class="ourhours" data-hour="${hoursTobeDiv[i]}">${hoursTobeDiv[i]}</div>`;
        hoursArray.push(outlierBase);
      }
      }
  
  console.log(hoursArray)
  let html = `<div class="renderedHours"><div class="calendarOfHours">${hoursArray.join(" ")}</div></div><footer class="selectedIndicatorB"  id="finished"><button>Finish<strong class="consoleWrite"> >></strong></button></footer>`

  return res.status(200).json({
    ok: "ok",
    render: html
  })

  } catch (error) {
    
  }
})
app.get("/render/days", tokenVerify, (req, res) => {
  const now = new Date();
  const calendar = [];
  let data = null;
  const weekDays = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sabado",
  ];
  const months = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];

  for (let i = 0; i < 30; i++) {
    data = new Date(now);
    data.setDate(now.getDate() + i);
    calendar.push({
      nomeDia: weekDays[data.getDay()],
      dia: data.getDate(),
      mes: months[data.getMonth()],
      ano: data.getFullYear(),
      dataCompleta: data.toLocaleDateString("pt-BR"),
    });
  }
  return res.status(200).json({
    calendario: calendar,
    nomeDia: weekDays[data.getDay()],
    dia: data.getDate(),
    mes: months[data.getMonth()],
    ano: data.getFullYear(),
    dataCompleta: data.toLocaleDateString("pt-BR"),
  });
});
async function extrairHoras(req, res) {
  try {
    const hours = await HoursStorage.find().lean();
    if (!hours || hours.length === 0) {
      return res.status(404).json({ message: "Nenhum horário encontrado" });
    } else {
      return res.json(hours);
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erro ao buscar horários", error: error.message });
  }
}
app.get("/api/hours", tokenVerify, extrairHoras);

app.get("/debuger", tokenVerify, async (req, res) => {
  try {
    const { name, email } = req.user;
    const debug_base = await StoreCad.findOne({ email: email });
    if (!debug_base) {
      return res.status(500).json({ er: "ERRROR", nome: name, Email: email });
    }
    return res.status(200).json({ s: "Sucess" });
  } catch (error) {}
});
function isValidHour(h) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
}

app.post("/horarioCad", tokenVerify, async (req, res) => {
  try {
    const { name, email } = req.user;
    const { hideHour, hour } = req.body;
    const store = await StoreCad.findOne({ name: name, email:email }).lean();
    if (!store) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }

    // hour pode ser string ou array
    const raw = hour;
    const hours = Array.isArray(raw) ? raw : raw ? [raw] : [];

    // Normaliza, remove vazios, valida e deduplica
    const normalized = hours.map((h) => String(h).trim()).filter(Boolean);
    const invalid = normalized.filter((h) => !isValidHour(h));
    if (invalid.length) {
      return res
        .status(400)
        .json({ message: "Horário(s) inválido(s)", invalid });
    }
    const uniqueHours = [...new Set(normalized)];

    // Salva como array no model HoursStorage
    const created = await HoursStorage.create({
      storeName: store.storeName,
      storeEmail: store.storeEmail,
      phone: store.phone,
      hour: uniqueHours,
    });

    return res.redirect("/functionary/register")
  } catch (error) {
    console.error("Erro em /horarioCad:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});
app.post("/schedule", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { choiceFunctionary, choiceHour, choiceDay, services, storeName } =
    req.body;
  try {
    const cadSchedule = await scheduleSchema.create({
      name: name,
      email: email,
      functionary: choiceFunctionary.join(", "),
      hour: choiceHour.join(", "),
      services: services,
      day: choiceDay.join(", "),
      storeName: storeName,
    });
    if (!cadSchedule) {
      return res.status(500).json({ error: "error in DB" });
    }
    return res.status(200).json({
      sucess: "Sucess",
      redirect: "/schedule/home",
    });
  } catch (error) {
    return res.status(500).json({ error: "Error in the server" });
  }
});

app.get("/schedule/home", tokenVerify, (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "schedule.html"));
});

app.get("/return/data/schedule", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const schedules = await scheduleSchema
    .find({ name: name, email: email })
    .lean();
  if (!schedules || schedules.length == 0) {
    return res.status(200).json({
      msg: "Nenhum dado encontrado",
      push: `
      <div class="notAllowed">
  <div class="call-action">
    <h1 class="call-h1">
      No Appointment <strong class="GreenCard">found</strong><strong class="pointer">,</strong>
    </h1>
    <p class="call-p">Discover partner stores and schedule your favorite services.</p>
  </div>

  <div class="central-plus">
    <div class="label-plus">
      <p>
        Schedule <strong class="GreenCard">Now</strong>
      </p>
    </div>
    <div class="img-plus">
      <img src="https://img.icons8.com/?size=100&id=95779&format=png&color=FFFFFF">
    </div>
  </div>
</div>
      `,
    });
  } else {
    console.log(schedules);

    let dS = [];
    for (let i = 0; i < schedules.length; i++) {
      let schedule = schedules[i];
      let cS = [];
      let DBStoreName = schedule.storeName.replaceAll(" ", "-");
      const services = await ServicesCad.findOne({
        storeName: DBStoreName,
      }).lean();
      console.log(services);
      if (!services) {
        return res.status(404).json({ msg: "error" });
      }
      const Userservice = schedule.services;

      for (let j = 0; j < Userservice.length; j++) {
        const serviceName = Userservice[j];
        const indexOfService = services.serviceName.indexOf(serviceName);
        if (indexOfService !== -1) {
          const imagePath = services.serviceImagePath[indexOfService];
          let html = `
          <p>${serviceName}`;
          cS.push(html);
        }
      }

      const storeName = schedule.storeName.replaceAll("-", " ");
      const day = schedule.day;
      const hour = schedule.hour;
      const functionary = schedule.functionary;
      const randomSymbol = [">_", ">>", "//"];
      let random = Math.floor(Math.random() * 3);
      let htmlD = `
    <div class="schedule-content">
      <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}">
        <div class="schedule-StoreName" ><strong class="consoleWrite">${
          randomSymbol[random]
        }</strong>${storeName}</div>

        <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
        <div class="schedule-Dam">
        <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
          <div class="schedule-services">${cS.join(" ,")}</p></div>
          <br>
          <strong class="jsonWrite">}</strong>
        </div>
          
        

        
      </div>
      <div class="lateralInfos">
        <div class="delete">
            <img
              src="https://img.icons8.com/?size=100&id=83149&format=png&color=FFFFFF"
            />
          </div>
        <div class="schedule-dayEHour">
              <div class="schedule-Day">
                 <strong class="dayEHour">${day}</strong>
              </div>
              <div class="schedule-Hour">
                 <strong class="dayEHour">${hour}</strong>
              </div>
            </div>
      </div>
    </div>
      `;
      dS.push(htmlD);
    }
    let htmlFULL = `<div class="schedule-some-div">
    
    
  </div><div class="schedule-union">${dS.join(" ")}<div class="central-plus">
          <div class="label-plus">
          <p>
          Schedule <strong class="GreenCard">Now</strong>
          </p>
          </div>
          <div class="img-plus">
            <img src="https://img.icons8.com/?size=100&id=95779&format=png&color=FFFFFF">
          </div>
        </div></div>`;
    return res.status(201).json({ ok: "ok", push: htmlFULL });
  }
});
app.delete("/delete/schedules", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { dia, hora, loja, funcionario } = req.body;

  try {
    const realName = loja.replaceAll(" ", "-");
    const deleter = await scheduleSchema.findOneAndDelete({
      name: name,
      email: email,
      functionary: funcionario,
      hour: hora,
      day: dia,
      storeName: realName,
    });
    if (!deleter) {
      return res.status(404).json({
        error: "Error 404, n encontrado",
      });
    }
    return res.status(201).json({
      s: "Sucess",
      redirect: "/reload",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Error 500, server error man, que merda",
    });
  }
});
app.get("/reload", (req, res) => {
  return res.redirect("/schedule/home");
});
app.get("/more", tokenVerify, (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "account.html"))
})
app.put("/update/user", tokenVerify, async (req, res) => {
  const {name, email} = req.user;
  const {new_name, new_email} = req.body;

  try {
    const updater = await User.findOneAndUpdate({
    nome: name,
    Email: email 
  }, {
    nome: new_name,
    Email: new_email
  }, {new: true})
  if (!updater){
    return res.status(404).json({err: "Foi impossivel encontrar e atualizar os dados :("})
  }
const updaterPayload = {
        id: updater._id.toString(),
        name:updater.nome,
        email:  updater.Email,
        itsNew: false,
      };

      const updateToken = jwt.sign(updaterPayload, JWT_SECRET, {
        expiresIn: "30d",
      });

      res.cookie("authToken", updateToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({sucess: 'Hello, world!', payload: updaterPayload})
  } catch (error) {
    return res.status(500).json({errno: error})
  }
})
app.get('/conditions', (req, res) => {res.sendFile(path.join(__dirname, "public", "conditions.html"))}) 
app.get("/privacy",(req, res) => {res.sendFile(path.join(__dirname, "public", "privacy.html"))} )//🤨

app.get("/verify/have/stores", tokenVerify, async (req, res) => {
  const {name, email} = req.user;
  try {
    const finder = await StoreCad.findOne({name: name, email: email})
  if (!finder){
    return res.status(200).json({returner: `<div class="notAllowed">
  <div class="call-action">
    <h1 class="call-h1">
      No stores found under your  <strong class="GreenCard">account</strong><strong class="pointer">.</strong>
    </h1>
    <p class="call-p">Register your store below to start managing appointments, services, and staff.</p>
  </div>

  <div class="central-plus">
    <div class="label-plus">
      <p>
        Start your journey <strong class="GreenCard">Now</strong>
      </p>
    </div>
    <div class="img-plus">
      <img src="https://img.icons8.com/?size=100&id=95779&format=png&color=FFFFFF">
    </div>
  </div>
</div>`})
  }

  return res.status(200).json({tudoCerto: ":>", finderData: finder, returner: JSON.stringify(finder)})
  } catch (error) {
    return res.redirect('/error500.html')
  }
})
app.get("/cad/store", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-store.html"))
})
app.get("/services/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-services.html"))
})
app.get("/hour/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-hours.html"))
})
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📧 Sistema de recuperação de senha ativo`);
});

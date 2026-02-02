import express from "express";
import dotenv from "dotenv";
import mongoose, { model } from "mongoose";
import User from "./Loginschema.js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import path from "path";
import nodemailer from "nodemailer";
import crypto, { randomBytes } from "crypto"; // ← Adicione isso
import { fileURLToPath } from "url";
import coding from "./codeSchema.js";
import StoreCad from "./StoreCadschema.js";
import ServicesCad from "./ServiceCadSchema.js";
import multer from "multer";
import sharp from "sharp";
import fs from "fs/promises";
import HoursStorage from "./HourSchema.js";
import { count, error } from "console";
import HourSchema from "./HourSchema.js";
import scheduleSchema from "./scheduleSchema.js";
import functionaryCad from "./functionaryCad.js";
import Stripe from "stripe";
import ServiceCadSchema from "./ServiceCadSchema.js";
import PlansSchema from "./BankSchema.js";
import BankSchema from "./BankSchema.js";
import { buffer } from "stream/consumers";
import plansSchema from "./plansSchema.js";
import userPlansSchema from "./userPlansSchema.js";
import store_data_schema from "./store_data_schema.js";
import reembolso from "./reembolso.js";
import recurring from "./recurring.js";
import StoreCadschema from "./StoreCadschema.js";
import cron from "node-cron"; // ✅ CORRETO
import favorite from "./favorite.js";
import storePlan from "./storePlan.js";
import obsolence from "./obsolence.js";
import ads from "./whilewhale.js";
dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const ENCRIPTION_KEY = process.env.ENCRIPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stripe = new Stripe(process.env.SECRET_STRIPE_KEY);
const emailToken = process.env.EMAILTOKEN;
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
// var transport = nodemailer.createTransport({
//   host: "sandbox.smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "d357f63add29f7",
//     pass: "fc32811f387516",
//   },
// });
// // ✅ Testa conexão ao iniciar
// transport.verify((error, success) => {
//   if (error) {
//     console.error("❌ Erro na configuração do email:", error.message);
//   } else {
//     console.log("✅ Servidor de email pronto para enviar mensagens");
//   }
// });

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
      new Error("Tipo de arquivo inválido. Apenas imagens são permitidas."),
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
// async function enviarEmailRecuperacao(email, resetToken) {
//   const resetUrl = `http://localhost:3000/reset-password.html`;

//   const emailOptions = {
//     from: "log.tools.app@gmail.com",
//     to: email,
//     subject: "Password recovery",
//     html: `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <style>
//                     body {

//                         background-color: #0D0D0D;
//                         margin: 0;
//                         padding: 0;
//                         display: flex;
//                         justify-content: center;
//                         height: 100vh;
//                         width: 100vw;
//                         overflow: hidden;
//                     }
//                     .container {
//                         height: 100vh;
//                         display: flex;
//                         flex-direction: column;
//                         justify-content: center;
//                         padding: 20px;
//                         background-color: transparent;
//                         border-radius: 10px;
//                         box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                     }
//                     .GreenCard{
//     color: #238C6E;
//     font-family: Arial, Helvetica, sans-serif;
// }
//                     .pointer{
//     width: 3vw;
//     height: 3vh;

//     margin-left: 5px;
//     font-family: Arial, Helvetica, sans-serif;
//     background-color: #f2f2f2;
//     color: #f2f2f2;
//     animation-name: pisk;
//     animation-duration: 0.7s;
//     animation-iteration-count: infinite;
//     animation-timing-function: steps(1);

// }
// @keyframes pisk {
//     0%{
//         opacity: 0;
//     }
//     50%{
//         opacity: 1;
//     }
//     100%{
//         opacity: 0;
//     }

// }

//                     .header {
//                         text-align: center;
//                         padding: 20px 0;
//                         color: #f2f2f2;
//                         font-family: Arial, Helvetica, sans-serif;
//                         border-bottom: 2px solid #238C6E;
//                         margin-bottom: 20px;
//                     }

//                     .link-box {
//                         background-color: #238C6E;
//                         padding: 10px;
//                         border-radius: 5px;
//                         word-break: break-all;
//                         font-size: 12px;
//                         font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//                         color: #f2f2f2;
//                     }
//                     .container p{
//                         color: #f2f2f2;
//                         margin: 5px;
//                         font-family: Arial, Helvetica, sans-serif;
//                     }
//                     #diferent{
//                         margin: 20px;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <div class="header">
//                         <h2>Password <strong class="GreenCard">Recovery</strong><strong class="pointer">||</strong></h2>
//                     </div>

//                     <p>Hi,</p>
//                     <p>How are you?</p>

//                     <p>
//                         You requested a password reset at https://log.bussiness
//                     </p>

//                     <p id="diferent">Paste the code below on our website and reset your password:</p>
//                     <div class="link-box">${resetToken}</div>

//                 </div>
//             </body>
//             </html>
//         `,
//   };

//   // ✅ IMPORTANTE: Retorna a Promise para poder tratar erros
//   return await transport.sendMail(emailOptions);
// }
// async function functionaryEmail(email, msg) {
//   const emailOptions = {
//     from: "log.tools.app@gmail.com",
//     to: email,
//     subject: "Update your appointment",
//     html: msg,
//   };

//   // ✅ IMPORTANTE: Retorna a Promise para poder tratar erros
//   return await transport.sendMail(emailOptions);
// }
function criptografar(datas) {
  const iv = crypto.randomBytes(16);
  const cypher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRIPTION_KEY, "hex"),
    iv,
  );
  let encrypted = cypher.update(datas, "utf-8", "hex");
  encrypted += cypher.final("hex");

  const authTag = cypher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

function descriptografar(encryptedata) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRIPTION_KEY, "hex"),
    Buffer.from(encryptedata.iv, "hex"),
  );

  decipher.setAuthTag(Buffer.from(encryptedata.authTag, "hex"));

  let decrypted = decipher.update(encryptedata.encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
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
  { maxWidth = 1024, maxHeight = 1024, quality = 80 } = {},
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
async function verificarAssinaturasExpiradas() {
  try {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth();
    const year = today.getFullYear();
    const subscription = await userPlansSchema.find({
      subscritionDay: `${day}/${month}/${year}`,
    });
    for (const sub of subscription) {
      const stripeSub = await stripe.subscriptions.retrieve(sub.subscriptionId);
      const pay = await plansSchema.findOne({
        planName: sub.planName,
        planPrice: sub.planPrice,
      });
      if (!pay) {
        console.error("PAY ERROR");
        continue;
      }
      const storePay = await store_data_schema.findOne({
        storeName: pay.storeName,
      });
      if (!storePay) {
        console.error("STORE PAY ERROR");
        continue;
      }
      const finishPay = await store_data_schema.findOneAndUpdate(
        {
          storeName: storePay.storeName,
          storeEmail: storePay.storeEmail,
        },
        {
          totalCash: storePay.totalCash + parseInt(pay.planPrice),
        },
      );
      if (!finishPay) {
        console.error("FINISH PAY ERROR");
      }
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + 30);
      const nextDay = nextDate.getDate();
      const nextMonth = nextDate.getMonth() + 1;
      const nextYear = nextDate.getFullYear();
      const nextQuery = `${nextDay}/${nextMonth
        .toString()
        .padStart(2, "0")}/${nextYear}`;
      const suber = await userPlansSchema.findOneAndUpdate(
        {
          name: sub.name,
          email: sub.email,
        },
        {
          subscritionDay: nextQuery,
        },
      );
      if (!suber) {
        console.error("FINISH PAY ERROR");
        continue;
      }
    }
  } catch (error) {
    console.error(error);
  }
}
// ========================================
// SUAS ROTAS DE LOGIN (permanecem iguais)
// ========================================
cron.schedule("0 * * * *", async () => {
  console.log("Verificando assinaturas...");
  await verificarAssinaturasExpiradas();
});

app.post("/api/login", async (req, res) => {
  try {
    const { name, email, password, redirect } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Por favor, preencha todos os campos." });
    }

    const usuario = await User.findOne({ nome: name, Email: email });

    if (usuario) {
      const senhaValida = await bcrypt.compare(password, usuario.password);

      if (!senhaValida) {
        return res
          .status(401)
          .json({ error: "Credenciais inválidas, tente login com Google" });
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

      return res.redirect(redirect);
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

      if (token) {
        res.redirect(redirect);
      }
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
        name: googleUsuario.nome,
        email: googleUsuario.Email,
        itsNew: false,
      };
      console.log(googlePayload);
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
  const { name, email } = req.user;
  try {
    const testStore = await StoreCadschema.findOne({
      name: name,
      email: email,
    });
    if (!testStore) {
      return res.status(200).json({
        name: name,
        email: email,
      });
    } else {
      return res.status(200).json({
        storeName: testStore.storeName,
        name: name,
        email: email,
      });
    }
  } catch (error) {}
});

app.get("/api/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return res.redirect("/index.html");
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
    console.log(`${request_name}, ${request_email}`);
    const finder = await User.findOne({
      nome: request_name,
      Email: request_email,
    });
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
      email: request_email,
      code: codet,
    });
    if (!registerCode) {
      return res.status(500).json({ error: "Error in cad. the code" });
    }
    console.log(codet)
    //await enviarEmailRecuperacao(request_email, codet);
    res.redirect("forgot.html");
  } catch (error) {
    console.error(error)
    return res.status(500).json({ mensage: "Error in the route :<", error: error });
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
      { password: hashPassword },
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
    res.redirect("home.html");
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
      return res.status(404).json({ error: "Error 404" });
    }

    let counter = 0;

    const returner = [];
    const fav = await favorite
      .find({
        name: name,
        email: email,
      })
      .lean();
    if (!fav) {
      return res.status(404).json({ error: "Error 404" });
    }
    const favMap = new Set(fav.map((f) => f.storeName));
    const sortedStores = findAllStores.sort((a, b) => {
      const aIsFav = favMap.has(a.storeName);
      const bIsFav = favMap.has(b.storeName);

      if (aIsFav && !bIsFav) return -1; // a vem antes
      if (!aIsFav && bIsFav) return 1; // b vem antes
      return 0; // mantém ordem original
    });
    const storesNames = sortedStores.map((store) => store.storeName);
    const storesNum = findAllStores.length;
    let striker = [];
    for (let i = 0; i < sortedStores.length; i++) {
      const store = sortedStores[i];
      const isFav = favMap.has(store.storeName);
      let order = ``;
      if (isFav) {
        order = `<img src="https://img.icons8.com/?size=100&id=84925&format=png&color=F4D03F" alt="" id="starOff">
           <img src="https://img.icons8.com/?size=100&id=85784&format=png&color=FFFFFF" alt="" id="starOn">`;
      } else {
        order = `<img src="https://img.icons8.com/?size=100&id=85784&format=png&color=FFFFFF" alt="" id="starOff"><img src="https://img.icons8.com/?size=100&id=84925&format=png&color=F4D03F" alt="" id="starOn">`;
      }
      const obs = await obsolence.findOne({
        storeName: sortedStores[i].storeName,
      });
      console.log(obs);
      if (obs) {
        const hoje = new Date();
        const dataFinal = new Date(obs.finisherDay);

        const diferencaMs = dataFinal - hoje;

        const daysFaltantes = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        console.log(diferencaMs);
        if (diferencaMs < 1) {
          const storef = await StoreCad.findOne({
            storeName: sortedStores[i].storeName,
          }).lean();
          if (storef) {
            const servicesDeleter = await ServicesCad.findOneAndDelete({
              storeName: sortedStores[i].storeName,
            });
            if (servicesDeleter) {
              const hourDeleter = await HoursStorage.findOneAndDelete({
                storeName: sortedStores[i].storeName,
              });
              if (hourDeleter) {
                const funcDeleter = await functionaryCad.findOneAndDelete({
                  storeName: sortedStores[i].storeName,
                });
                if (funcDeleter) {
                  const storeDeleter = await StoreCad.findOneAndDelete({
                    storeName: sortedStores[i].storeName,
                  });
                  if (!storeDeleter) {
                    return res.status(400).json({
                      error: "errooooooooooooooooooooooooooooooooooooor",
                    });
                  }
                }
              }
            }
          }
        }
        let htmlStructure = `<div class="store obsolete-store">
                        <div class="juntos">
                            <div id="img">
                                <img src="${
                                  sortedStores[i].storeImagePath
                                }" alt="">
                            </div>
                            <div id="storeinfos">
                                <p id="storename"><strong class="GreenCard">&lt;/</strong>${sortedStores[
                                  i
                                ].storeName.replaceAll(
                                  "/",
                                  " ",
                                )}<strong class="GreenCard">/></strong></p>
                                <p id="storeDescription">This store has been deleter in  <strong class="jsonWrite" style="margin-left:10px;"> ${daysFaltantes} days</strong></p>
                            </div>
                        </div>
                        <div id="moreinfos">
                            <button>
                                <img src="https://img.icons8.com/?size=100&id=110674&format=png&color=FFFFFF">
                            </button>
                        </div>
                    </div>`;
        counter++;
        returner.push(htmlStructure);
        striker.push(sortedStores[i].storeName);
      }
      if (sortedStores[i].storeImagePath) {
        if (!striker.includes(sortedStores[i].storeName)) {
          const htmlStructure = `<div class="store">
                        <div class="juntos">
                            <div id="img">
                                <img src="${
                                  sortedStores[i].storeImagePath
                                }" alt="">
                            </div>
                            <div id="storeinfos">
                                <p id="storename"><strong class="GreenCard">&lt;/</strong>${sortedStores[
                                  i
                                ].storeName.replaceAll(
                                  "/",
                                  " ",
                                )}<strong class="GreenCard">/></strong></p>
                                <p id="storeDescription">${
                                  sortedStores[i].description
                                }</p>
                            </div>
                        </div>
                        <div id="moreinfos">
                            <button data-fav="${isFav}">
                                ${order}
                            </button>
                        </div>
                    </div>`;
          counter++;
          returner.push(htmlStructure);
        }
      }
    }
    console.log(returner.join(""));
    return res.status(200).json({
      return: returner,
      closedHour: findAllStores.map((store) => store.closedHours),
      closedDays: findAllStores.map((store) => store.closedDays),
      openHours: findAllStores.map((store) => store.openHours),
      storeName: storesNames,
    });
  } catch (error) {
    console.log(error);
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
      })),
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
      pin,
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
      (f) => f.fieldname === "storeImage",
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
          "store",
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
    const data = new Date();
    const legalFormat = data.toLocaleString("pt-br");
    const createBasicInfos = await store_data_schema.create({
      name: name,
      email: email,
      storeName: storeNamer,
      storeEmail: storeEmail,
      totalCash: 0,
      closedChoice: [],
      totalVisits: 0,
      totalAppointments: 0,
      totalAppointmentsPayed: 0,
      planNumber: 0,
      prePayment: true,
      createdAt: `${legalFormat}`,
      money: 0,
    });
    if (!createBasicInfos) {
      return res.status(400).json({
        tudoErrado: ":>",
        // finderData: finder,
        // outherData: outherFinder,
        returner: "ERRORRORORORROROROROR",
      });
    }
    console.log("✅ Loja cadastrada:", newStore._id);
    console.log("📁 Imagem salva em:", imageInfo?.path || "sem imagem");

    return res.redirect("/services/register");
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
  const forStoreName = storeName.replaceAll("/", "_");
  const datas = await store_data_schema.findOne({ storeName: storeName });
  if (!datas) {
    return res.status(404).json({ error: "Not found bro" });
  }
  datas.totalVisits += 1;
  await datas.save();
  return res.status(200).json({ redirect: `/store/:${forStoreName}` });
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
      })),
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
      req.body["serviceName[]"] ?? req.body.serviceName,
    );
    const serviceDescs = toArray(
      req.body["serviceDesc[]"] ?? req.body.serviceDesc,
    );
    const servicePricesRaw = toArray(
      req.body["servicePrice[]"] ?? req.body.servicePrice,
    );
    const servicesTime = toArray(
      req.body["servicesTime[]"] ?? req.body.servicesTime,
    );
    const files = req.files || [];

    const total =
      Math.max(
        serviceNames.length,
        serviceDescs.length,
        servicePricesRaw.length,
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
          "service",
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
      servicesTime: servicesTime,
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
      `Criados ${created.length} serviço(s). files.length=${files.length}`,
    );
    return res.redirect("/hour/register");
  } catch (error) {
    console.error("Erro ao cadastrar serviços:", error);
    return res.status(500).json({
      message: "Erro ao processar o cadastro de serviços.",
      error: error.message,
    });
  }
});
app.get("/stores/home", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "stores.html"));
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
  const findInDB = await functionaryCad
    .findOne({ storeName: cstoreName })
    .lean();
  if (!findInDB) {
    return res.status(404).json({
      mensage: "ERRROR 404, store not found or error in my code, also :(",
    });
  }
  const nameOfFunctionarys = findInDB.functionarysName;
  const imagePath = findInDB.functionaryImagePath;
  let c = 0;
  let functionarysArray = [];
  for (let i = 0; i < nameOfFunctionarys.length; i++) {
    const moreBase = `<br><div class="functionaryBaseDiv" name-of="${nameOfFunctionarys[c]}"><div class="uniondivers">
      <div class="imageFunctionary"><img src="${imagePath[c]}"></div><div class="nameOfFunctionary">
        <p>${nameOfFunctionarys[c]}</p>
      </div>
    </div><div class="functionaryMore" style="opacity:0;">
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
function timeToMinutes(time) {
  const [horas, minutos] = time.split(":").map(Number);
  return horas * 60 + minutos;
}
app.post("/api/selected/hours", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { storeName, functionary, day } = req.body;
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
    const date = new Date();
    const today = date.getDate();
    const month = date.getMonth() + 1;
    const query = `${today}/${month.toString().padStart(2, "0")}`;
    const hrEmMin = date.getHours() * 60 + date.getMinutes();
    const reqScheudle = await scheduleSchema.find({
      storeName: cstoreName,
      functionary: functionary,
      day: day,
    });
    const scheduledHours = reqScheudle.map((schedule) => schedule.hour);
    for (let i = 0; i < hoursTobeDiv.length; i++) {
      if (day === query) {
        const [horaM, minutos] = hoursTobeDiv[i].split(":").map(Number);
        const horaAgendamentosMinutos = horaM * 60 + minutos;
        const diferenca = horaAgendamentosMinutos - hrEmMin;
        if (diferenca < 0) {
          continue;
        }
      }
      let blocked = false;
      for (const schedule of reqScheudle) {
        const inicioAgendamento = timeToMinutes(schedule.hour);
        const fimAgendamento = timeToMinutes(schedule.finishHour);
        const horarioAtual = timeToMinutes(hoursTobeDiv[i]);

        if (
          horarioAtual >= inicioAgendamento &&
          horarioAtual < fimAgendamento
        ) {
          blocked = true;
          break;
        }
      }
      if (!blocked) {
        const outlierBase = `<br><div class="ourhours" data-hour="${hoursTobeDiv[i]}">${hoursTobeDiv[i]}</div>`;
        hoursArray.push(outlierBase);
      }
    }

    console.log(hoursArray);
    let html = `<div class="renderedHours"><div class="calendarOfHours">${hoursArray.join(
      " ",
    )}</div></div><footer class="selectedIndicatorB"  id="finished"><button>Finish<strong class="consoleWrite"> >></strong></button></footer>`;

    return res.status(200).json({
      ok: "ok",
      render: html,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.post("/render/days", tokenVerify, async (req, res) => {
  const { storeName } = req.body;
  const now = new Date();
  const calendar = [];
  let data = null;
  let realName = storeName.replaceAll(" ", "/");
  const searcher = await store_data_schema.findOne({ storeName: realName });
  if (!searcher) {
    console.log("ERROR NO SEARCH");
    return res.status(404).json({
      erro: "NINGUEM ENCONTROU NADA QUI N PARCEIRO",
    });
  }

  const datas_proibidas = searcher.closedChoice;
  console.log(datas_proibidas);
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday,",
    "Friday",
    "Saturday",
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
    datas_proibidas: datas_proibidas,
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
    const store = await StoreCad.findOne({ name: name, email: email }).lean();
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

    return res.redirect("/functionary/register");
  } catch (error) {
    console.error("Erro em /horarioCad:", error);
    return res.status(500).json({ message: "Erro no servidor" });
  }
});
app.post("/schedule", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const {
    choiceFunctionary,
    choiceHour,
    choiceDay,
    services,
    storeName,
    price,
    time,
  } = req.body;
  try {
    const realStoreName = storeName.replaceAll(" ", "/");

    const cadSchedule = await scheduleSchema.create({
      name: name,
      email: email,
      functionary: choiceFunctionary.join(", "),
      hour: choiceHour.join(", "),
      finishHour: time,
      services: services,
      day: choiceDay.join(", "),
      storeName: realStoreName,
      payed: false,
      totalPrice: price,
      stripeId: null,
    });
    if (!cadSchedule) {
      return res.status(500).json({ error: "error in DB" });
    }

    const datas = await store_data_schema.findOne({ storeName: realStoreName });
    if (!datas) {
      return res.status(404).json({ error: "Not found bro" });
    }
    datas.totalAppointments += 1;
    datas.totalCash += price;
    await datas.save();
    const scheduleId = cadSchedule.id;
    const findFunctionary = await functionaryCad.findOne({
      storeName: realStoreName,
    });
    if (!findFunctionary) {
      return res.status(500).json({ error: "error in DB" });
    }

    const findThisFunctionary =
      findFunctionary.functionarysName.indexOf(choiceFunctionary);
    const functionaryMail =
      findFunctionary.functionarysEmail[findThisFunctionary];
    let msg = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Appointment</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #0d0d0d 0%, #042326 100%);
            min-height: 100vh;
            padding: 20px;
            color: #f2f2f2;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: rgba(13, 13, 13, 0.8);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(166, 166, 166, 0.2);
        }

        .header {
            background: linear-gradient(135deg, #238c6e 0%, #1a6b54 100%);
            padding: 30px 20px;
            text-align: center;
        }

        .header h1 {
            font-size: clamp(20px, 5vw, 28px);
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .header p {
            font-size: clamp(14px, 3vw, 16px);
            color: rgba(255, 255, 255, 0.9);
        }

        .content {
            padding: 30px 20px;
        }

        .greeting {
            margin-bottom: 24px;
        }

        .greeting h2 {
            font-size: clamp(18px, 4vw, 24px);
            margin-bottom: 8px;
        }

        .greeting .highlight {
            color: #238c6e;
        }

        .info-card {
            background-color: rgba(35, 140, 110, 0.1);
            border: 1px solid rgba(35, 140, 110, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .info-row:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-size: clamp(13px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.7);
            margin-bottom: 4px;
            width: 100%;
        }

        .info-value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: 600;
            color: #238c6e;
            word-break: break-word;
        }

        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }

        .detail-box {
            background-color: rgba(35, 140, 110, 0.08);
            border: 1px solid rgba(166, 166, 166, 0.15);
            border-radius: 10px;
            padding: 16px;
            text-align: center;
        }

        .detail-box .label {
            font-size: clamp(12px, 3vw, 13px);
            color: rgba(242, 242, 242, 0.6);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .detail-box .value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: 700;
            color: #238c6e;
        }

        .footer {
            padding: 20px;
            text-align: center;
            border-top: 1px solid rgba(166, 166, 166, 0.15);
        }

        .footer p {
            font-size: clamp(12px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.5);
        }

        .icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
        }

        /* Responsividade para mobile */
        @media only screen and (max-width: 480px) {
            body {
                padding: 10px;
            }

            .container {
                border-radius: 12px;
            }

            .header {
                padding: 24px 16px;
            }

            .content {
                padding: 24px 16px;
            }

            .info-card {
                padding: 16px;
            }

            .details-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .detail-box {
                padding: 14px;
            }
        }

        /* Suporte para dark mode em clientes de email */
        @media (prefers-color-scheme: dark) {
            body {
                background: linear-gradient(135deg, #0d0d0d 0%, #042326 100%);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ New Appointment</h1>
            <p>You have a new client waiting</p>
        </div>

        <div class="content">
            <div class="greeting">
                <h2>Hello, <span class="highlight">${choiceFunctionary.join(
                  "",
                )}</span>!</h2>
                <p style="color: rgba(242, 242, 242, 0.8); margin-top: 8px;">
                    A new appointment has been confirmed for you.
                </p>
            </div>

            <div class="info-card">
                <div class="info-row">
                    <span class="info-label">👤 Cliente</span>
                    <span class="info-value">${name}</span>
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-box">
                    <div class="label">📅 Date</div>
                    <div class="value">${choiceDay.join("")}</div>
                </div>

                <div class="detail-box">
                    <div class="label">🕒 Time</div>
                    <div class="value">${choiceHour.join("")}</div>
                </div>

                <div class="detail-box">
                    <div class="label">💰 Price</div>
                    <div class="value">R$ ${price / 100}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 8px;">© 2025 Your Appointment System</p>
        </div>
    </div>
</body>
</html>`;
    const mtp = await recurring.findOne({
      name: name,
      email: email,
      storeName: realStoreName,
    });
    if (!mtp) {
      console.log("QUE MERDA BRO!!!!!!!!!");
      return res.status(400).json({ error: "Na verficação 7" });
    }
    mtp.scheduleNumber += 1;
    await mtp.save();
    //functionaryEmail(functionaryMail, msg);
    return res.status(200).json({
      sucess: "Sucess",
      redirect: `/pay/app/${scheduleId}`,
    });
  } catch (error) {
    return res.status(500).json({ error: "Error in the server" });
  }
});

app.get("/schedule/home", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "schedule.html"));
});

app.get("/return/data/schedule", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const schedules = await scheduleSchema
    .find({ name: name, email: email })
    .lean();
  console.log("SOU SEUS SCHEDULES : " + schedules);
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
      const services = await ServicesCad.findOne({
        storeName: schedule.storeName,
      }).lean();
      console.log(
        "Sou seus serviços" + services + "Sou seu nome:" + schedule.storeName,
      );
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

      const storeName = schedule.storeName.replaceAll("/", " ");
      const day = schedule.day;
      const hour = schedule.hour;
      const functionary = schedule.functionary;
      const randomSymbol = [">_", ">>", "//"];
      let random = Math.floor(Math.random() * 3);
      let price = schedule.totalPrice / 100;
      let totalPrice = price.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      if (schedule.payed) {
        let htmlD = `
        <div class="union">
          <div class="payed-symbol" title="Previously paid"> <img src="https://img.icons8.com/?size=100&id=122142&format=png&color=FFFFFF"></div>
              <div class="schedule-content schedule-payed">
                <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}">
          <div class="schedule-StoreName" ><strong class="consoleWrite">${
            randomSymbol[random]
          }</strong>${storeName}</div>
          <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
          <div class="schedule-Dam">
          <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
            <div class="schedule-services">${cS
              .splice(0, 3)
              .join(" ,")},<br></p></div>
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
          <div class="columnUnion">
            <strong class="pricery">R$ ${totalPrice}</strong>
            <div class="schedule-dayEHour">
                  <div class="schedule-Day">
                     <strong class="dayEHour">${day}</strong>
                  </div>
                  <div class="schedule-Hour">
                     <strong class="dayEHour" style="font-size:0.9em;">${hour} - ${
                       schedule.finishHour
                     }</strong>
                  </div>
                </div>
          </div>
                </div>
              </div>
        </div>
      `;
        dS.push(htmlD);
      } else {
        let htmlD = `
       
    <div class="schedule-content">
      <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}">
        <div class="schedule-StoreName" ><strong class="consoleWrite">${
          randomSymbol[random]
        }</strong>${storeName}</div>

        <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
        <div class="schedule-Dam">
        <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
          <div class="schedule-services">${cS
            .splice(0, 3)
            .join(" ,")}<br></p></div>
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
        <div class="columnUnion">
            <strong class="pricery">R$ ${totalPrice}</strong>
            <div class="schedule-dayEHour">
                  <div class="schedule-Day">
                     <strong class="dayEHour">${day}</strong>
                  </div>
                  <div class="schedule-Hour">
                     <strong class="dayEHour" style="font-size:0.9em;">${hour} - ${
                       schedule.finishHour
                     }</strong>
                  </div>
                </div>
          </div>
      </div>
    </div>
      `;
        dS.push(htmlD);
      }
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
    const realName = loja.replaceAll(" ", "/");
    const finder = await scheduleSchema.findOne({
      name: name,
      email: email,
      functionary: funcionario,
      hour: hora,
      day: dia,
      storeName: realName,
    });
    if (!finder) {
      return res.status(404).json({
        error: "Error 404, server error man, que merda",
      });
    }
    if (finder.payed) {
      const session = await stripe.checkout.sessions.retrieve(finder.stripeId);

      if (session.payment_intent) {
        const refundAmount = Math.floor((finder.totalPrice * 80) / 100);
        const originalFee = Math.floor(finder.totalPrice * 0.07); // R$ 5,25 (525 centavos)
        const feeToRefund = Math.floor((originalFee * 80) / 100); // R$ 4,20 (420 centavos)
        const reembolsar = await stripe.refunds.create({
          payment_intent: session.payment_intent,
          amount: refundAmount,
          reverse_transfer: true,
          reason: "requested_by_customer",
          metadata: {
            customer_name: name,
            customer_email: email,
            store_name: realName,
            refundPercent: "80%",
          },
        });
        const cadReembolso = await reembolso.create({
          name: name,
          email: email,
          storeName: realName,
          totalPrice: refundAmount,
          scheduleId: finder._id,
          stripeRefundId: reembolsar.id,
          status: reembolsar.status,
        });
        if (!cadReembolso) {
          console.error("IN CAD REEMBOLSO");
          return res.status(400).json({
            error: "IN CAD REEMBOLSO",
          });
        }
      }
    }
    const f = await store_data_schema.findOne({
      storeName: realName,
    });
    if (!f) {
      return res.status(404).json({
        error: "Error 404, server error man, que merda",
      });
    }
    const value = await store_data_schema.findOneAndUpdate(
      {
        storeName: realName,
      },
      {
        totalCash: f.totalCash - (parseInt(finder.totalPrice) * 80) / 100,
        money: f.money - (parseInt(finder.totalPrice) * 80) / 100,
      },
    );
    if (!value) {
      return res.status(400).json({
        error: "Error 400, server error man, que merda",
      });
    }
    let msg = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Appointment Cancelled</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #0d0d0d 0%, #1a0d0d 100%);
            min-height: 100vh;
            padding: 20px;
            color: #f2f2f2;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: rgba(13, 13, 13, 0.8);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(166, 166, 166, 0.2);
        }

        .header {
            background: linear-gradient(135deg, #8c2323 0%, #6b1a1a 100%);
            padding: 30px 20px;
            text-align: center;
            position: relative;
        }

        .warning-icon {
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
        }

        .header h1 {
            font-size: clamp(20px, 5vw, 28px);
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .header p {
            font-size: clamp(14px, 3vw, 16px);
            color: rgba(255, 255, 255, 0.9);
        }

        .content {
            padding: 30px 20px;
        }

        .greeting {
            margin-bottom: 24px;
        }

        .greeting h2 {
            font-size: clamp(18px, 4vw, 24px);
            margin-bottom: 8px;
        }

        .greeting .highlight {
            color: #e74c3c;
        }

        .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: clamp(13px, 3vw, 14px);
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-card {
            background-color: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .info-row:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-size: clamp(13px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.7);
            margin-bottom: 4px;
            width: 100%;
        }

        .info-value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: 600;
            color: #e74c3c;
            word-break: break-word;
        }

        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }

        .detail-box {
            background-color: rgba(231, 76, 60, 0.08);
            border: 1px solid rgba(166, 166, 166, 0.15);
            border-radius: 10px;
            padding: 16px;
            text-align: center;
        }

        .detail-box .label {
            font-size: clamp(12px, 3vw, 13px);
            color: rgba(242, 242, 242, 0.6);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .detail-box .value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: 700;
            color: #e74c3c;
        }

        .notice-box {
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(231, 76, 60, 0.05) 100%);
            border: 2px solid rgba(231, 76, 60, 0.4);
            border-radius: 12px;
            padding: 20px;
            margin-top: 24px;
        }

        .notice-box .notice-title {
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: 700;
            color: #e74c3c;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .notice-box .notice-text {
            font-size: clamp(13px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.8);
            line-height: 1.6;
        }

        .footer {
            padding: 20px;
            text-align: center;
            border-top: 1px solid rgba(166, 166, 166, 0.15);
        }

        .footer p {
            font-size: clamp(12px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.5);
        }

        /* Responsiveness */
        @media only screen and (max-width: 480px) {
            body {
                padding: 10px;
            }

            .container {
                border-radius: 12px;
            }

            .header {
                padding: 24px 16px;
            }

            .warning-icon {
                width: 50px;
                height: 50px;
                font-size: 28px;
            }

            .content {
                padding: 24px 16px;
            }

            .info-card {
                padding: 16px;
            }

            .details-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .detail-box {
                padding: 14px;
            }

            .notice-box {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="warning-icon">✕</div>
            <h1>⚠️ Appointment Cancelled</h1>
            <p>An appointment has been cancelled</p>
        </div>

        <div class="content">
            <div class="greeting">
                <h2>Hello, <span class="highlight">${funcionario}</span></h2>
                <p style="color: rgba(242, 242, 242, 0.8); margin-top: 8px;">
                    The appointment for <strong style="color: #e74c3c;">${name}</strong> has been cancelled.
                </p>
            </div>

            <div style="text-align: center;">
                <span class="status-badge">✕ Cancelled</span>
            </div>

            <div class="info-card">
                <div class="info-row">
                    <span class="info-label">👤 Client</span>
                    <span class="info-value">${name}</span>
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-box">
                    <div class="label">📅 Date</div>
                    <div class="value">${dia}</div>
                </div>

                <div class="detail-box">
                    <div class="label">🕒 Time</div>
                    <div class="value">${hora}</div>
                </div>

                <div class="detail-box">
                    <div class="label">💰 Amount</div>
                    <div class="value">$${finder.totalPrice / 100}</div>
                </div>
            </div>

            <div class="notice-box">
                <div class="notice-title">
                    <span>ℹ️</span>
                    <span>Important Notice</span>
                </div>
                <div class="notice-text">
                    This time slot is now available for new bookings. The client has been notified of the cancellation.
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 8px;">© 2025 Your Appointment System</p>
        </div>
    </div>
</body>
</html>`;
    const mtp = await recurring.findOne({
      name: name,
      email: email,
      storeName: realName,
    });
    if (!mtp) {
      return res.status(400).json({ error: "Na verficação 3" });
    }
    mtp.cancelNumber += 1;
    await mtp.save();
    const functionary_email = await functionaryCad.findOne({
      functionarysName: funcionario,
      storeName: realName,
    });
    if (!functionary_email) {
      return res.status(404).json({
        error: "Error 404, n encontrado aqui em functionary email",
      });
    }
    //functionaryEmail(functionary_email.functionarysEmail, msg);

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
    console.error(error);
    return res.status(500).json({
      error: "Error 500, server error man, que merda",
    });
  }
});
app.get("/reload", (req, res) => {
  return res.redirect("/schedule/home");
});
app.get("/more", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "account.html"));
});
app.put("/update/user", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { new_name, new_email } = req.body;

  try {
    const updater = await User.findOneAndUpdate(
      {
        nome: name,
        Email: email,
      },
      {
        nome: new_name,
        Email: new_email,
      },
      { new: true },
    );
    if (!updater) {
      return res
        .status(404)
        .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
    }
    const findToUpdate = await recurring
      .find({
        name: name,
        email: email,
      })
      .lean();
    if (findToUpdate) {
      for (let i = 0; i < findToUpdate.length; i++) {
        const storeName = findToUpdate[i].storeName;
        const updateRecurring = await recurring.findOneAndUpdate(
          {
            name: name,
            email: email,
            storeName: storeName,
          },
          {
            name: new_name,
            email: new_email,
          },
          { new: true },
        );
        if (!updateRecurring) {
          console.log("UPDATE RECURRING");
          console.log("ERRO AO ATUALIZAR ESTE RECURRING", findToUpdate[i]);
          continue;
        }
      }
    }
    const findToSchedules = await scheduleSchema.find({
      name: name,
      email: email,
    });
    if (findToSchedules) {
      for (let i = 0; i < findToSchedules.length; i++) {
        const storeName = findToSchedules[i].storeName;
        const updateSchedules = await scheduleSchema.findOneAndUpdate(
          {
            name: name,
            email: email,
            storeName: storeName,
          },
          {
            name: new_name,
            email: new_email,
          },
          { new: true },
        );
        if (!updateSchedules) {
          console.log("UPDATE SCHEDULES");
          console.log("ERRO AO ATUALIZAR ESTE RECURRING", findToUpdate[i]);
          continue;
        }
      }
    }

    const findToPlans = await userPlansSchema.find({
      name: name,
      email: email,
    });
    if (findToPlans) {
      for (let i = 0; i < findToPlans.length; i++) {
        const storeName = findToPlans[i].storeName;
        const updatePlans = await userPlansSchema.findOneAndUpdate(
          {
            name: name,
            email: email,
            storeName: storeName,
          },
          {
            name: new_name,
            email: new_email,
          },
          { new: true },
        );
        if (!updatePlans) {
          console.log("ERRO AO ATUALIZAR ESTE RECURRING", findToUpdate[i]);
          continue;
        }
      }
    }

    const findToreembolso = await reembolso.find({
      name: name,
      email: email,
    });
    if (findToreembolso) {
      for (let i = 0; i < findToreembolso.length; i++) {
        const storeName = findToreembolso[i].storeName;
        const updateReembolso = await reembolso.findOneAndUpdate(
          {
            name: name,
            email: email,
            storeName: storeName,
          },
          {
            name: new_name,
            email: new_email,
          },
          { new: true },
        );
        if (!updateReembolso) {
          console.log("ERRO AO ATUALIZAR ESTE RECURRING", findToUpdate[i]);
          continue;
        }
      }
    }
    const finderStore = await StoreCadschema.findOne({
      name: name,
      email: email,
    });
    if (finderStore) {
      const updater2 = await store_data_schema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          name: new_name,
          email: new_email,
        },
        { new: true },
      );
      if (!updater2) {
        return res
          .status(404)
          .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
      }
      const updater3 = await StoreCadschema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          name: new_name,
          email: new_email,
        },
        { new: true },
      );
      if (!updater3) {
        return res
          .status(404)
          .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
      }
      const updater4 = await functionaryCad.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          name: new_name,
          email: new_email,
        },
        { new: true },
      );
      if (!updater4) {
        return res
          .status(404)
          .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
      }
      const updater6 = await ServiceCadSchema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          name: new_name,
          email: new_email,
        },
        { new: true },
      );
      if (!updater6) {
        return res
          .status(404)
          .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
      }
    }

    // const updater7 = await BankSchema.findOneAndUpdate(
    //   {
    //     name: name,
    //     email: email,
    //   },
    //   {
    //     name: new_name,
    //     email: new_email,
    //   },
    //   { new: true }
    // );
    // if (!updater7) {
    //   return res
    //     .status(404)
    //     .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
    // }
    const findPlansDatas = await PlansSchema.findOne({
      name: name,
      email: email,
    });
    if (findPlansDatas) {
      const updater8 = await plansSchema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          name: new_name,
          email: new_email,
        },
        { new: true },
      );
      if (!updater8) {
        return res
          .status(404)
          .json({ err: "Foi impossivel encontrar e atualizar os dados :(" });
      }
    }
    const updaterPayload = {
      id: updater._id.toString(),
      name: updater.nome,
      email: updater.Email,
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
    return res
      .status(200)
      .json({ sucess: "Hello, world!", payload: updaterPayload });
  } catch (error) {
    return res.status(500).json({ errno: error });
  }
});
app.get("/conditions", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "conditions.html"));
});
app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "privacy.html"));
}); //🤨

app.get("/verify/have/stores", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const finder = await StoreCad.findOne({ name: name, email: email });

    if (!finder) {
      return res.status(200).json({
        returner: `<div class="notAllowed">
  <div class="call-action">
    <h1 class="call-h1">
      Your don't have  <strong class="GreenCard">stores</strong><strong class="pointer">.</strong>
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
</div>`,
      });
    }
    const outherFinder = await scheduleSchema
      .find({
        storeName: finder.storeName,
      })
      .lean()
      .limit(64);
    const today = new Date();
    const hrEmMin = today.getHours() * 60 + today.getMinutes();
    console.log(hrEmMin);
    const ordenadosAgendamentos = outherFinder
      .map((agendamento) => {
        const [hora, minutos] = agendamento.finishHour.split(":").map(Number);
        const horaAgendamentosMinutos = hora * 60 + minutos;
        const diferenca = horaAgendamentosMinutos - hrEmMin;

        return {
          ...agendamento,
          diferenca: diferenca,
        };
      })
      .filter((agendamento) => agendamento.diferenca >= 0)
      .sort((a, b) => a.diferenca - b.diferenca);
    console.log(ordenadosAgendamentos);
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const dataDeHj = `${day}/${month.toString().padStart(2, "0")}`;
    console.log(dataDeHj);
    const dayArray = [];
    let globalValue = 0;
    const htmlArray = [];

    for (let i = 0; i < ordenadosAgendamentos.length; i++) {
      let cS = [];
      let day = ordenadosAgendamentos[i].day;
      let nameC = ordenadosAgendamentos[i].name;
      let emailC = ordenadosAgendamentos[i].email;
      let hour = ordenadosAgendamentos[i].hour;
      let value = ordenadosAgendamentos[i].totalPrice / 100;
      let finishH = ordenadosAgendamentos[i].finishHour;
      let payed = ordenadosAgendamentos[i].payed;
      const functionary = ordenadosAgendamentos[i].functionary;
      const services = ordenadosAgendamentos[i].services;
      const storeName = ordenadosAgendamentos[i].storeName;
      const randomSymbol = ["$", "#", ">>"];
      let random = Math.floor(Math.random() * 3);
      for (let j = 0; j < services.length; j++) {
        let serviceName = services[j];
        let html = `
        <p>${serviceName}
        `;
        cS.push(html);
      }
      if (day === dataDeHj) {
        dayArray.push({
          day: day,
          name: nameC,
          email: emailC,
          hour: hour,
          value: value,
        });
        if (!payed) {
          let structure = `<div class="schedule-content schedule-portrait">
      <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}"  data-nameC="${nameC}" data-emailC="${emailC}">
        <div class="schedule-StoreName" ><strong class="consoleWrite">${
          randomSymbol[random]
        }</strong>${nameC}</div>

        <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
        <div class="schedule-Dam">
        <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
          <div class="schedule-services">${cS.join(",")}</p></div>
          <br>
          <strong class="jsonWrite">}</strong>
        </div>
          
        

        
      </div>
      <div class="lateralInfos">
       <div class="delete">
              <img
                src="https://img.icons8.com/?size=100&id=95771&format=png&color=FFFFFF"
              />
            </div>
            <div class="confirm">
              <img
                src="https://img.icons8.com/?size=100&id=83145&format=png&color=FFFFFF"
              />
            </div>
        <div class="schedule-dayEHour">
              <div class="schedule-Day">
                 <strong class="dayEHour">$ ${value
                   .toFixed(2)
                   .replace(".", ",")}</strong>
              </div>
              <div class="schedule-Hour">
                 <strong class="dayEHour">${hour} - ${finishH}</strong>
              </div>
            </div>
      </div>
    </div>
      `;
          htmlArray.push(structure);
        } else {
          let structure = `<div class="union schedule-portrait" >
          <div class="payed-symbol" title="Previously paid"> <img src="https://img.icons8.com/?size=100&id=122142&format=png&color=FFFFFF"></div>
              <div class="schedule-content schedule-payed ">
                <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}" data-nameC="${nameC}" data-emailC="${emailC}">
          <div class="schedule-StoreName" ><strong class="consoleWrite">${
            randomSymbol[random]
          }</strong>${nameC}</div>
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
                src="https://img.icons8.com/?size=100&id=95771&format=png&color=FFFFFF"
              />
            </div>
            <div class="confirm">
              <img
                src="https://img.icons8.com/?size=100&id=83145&format=png&color=FFFFFF"
              />
            </div>
          <div class="schedule-dayEHour">
                <div class="schedule-Day">
                 <strong class="dayEHour">$ ${value
                   .toFixed(2)
                   .replace(".", ",")}</strong>
              </div>
                 <div class="schedule-Hour">
                 <strong class="dayEHour">${hour} - ${finishH}</strong>
              </div>
              </div>
                </div>
              </div>
        </div>`;
          htmlArray.push(structure);
        }
      }
      if (payed) {
        globalValue += value;
      }
    }
    console.log(globalValue);
    const scheduleN = dayArray.length;
    const nextDays = [];
    const nexterdays = await store_data_schema.findOne({
      storeName: finder.storeName,
    });
    if (!nexterdays) {
      return res.status(400).json({
        tudoErrado: ":>",
        finderData: finder,
        outherData: outherFinder,
        returner: "Eu",
      });
    }
    for (let o = 0; o < 8; o++) {
      const data = new Date(today);
      data.setDate(today.getDate() + o);
      const dia = data.getDate();
      const mes = data.getMonth() + 1;
      const query = `${dia.toString()}/${mes.toString().padStart(2, "0")}`;
      if (nexterdays.closedChoice.includes(query)) {
        const structure = `<div class="weekDiv todayClosed" data-dia="${dia.toString()}/${mes
          .toString()
          .padStart(2, "0")}">${dia.toString().padStart(2, "0")}</div>`;
        nextDays.push(structure);
        continue;
      }
      const structure = `<div class="weekDiv" data-dia="${dia.toString()}/${mes
        .toString()
        .padStart(2, "0")}">${dia.toString().padStart(2, "0")}</div>`;
      nextDays.push(structure);
    }
    console.log(nextDays);
    const basicInfos = await store_data_schema.findOne({
      name: name,
      email: email,
      storeName: finder.storeName,
    });

    if (basicInfos) {
      let cash = basicInfos.totalCash / 100;
      let scheduleRemanescentes = 0;
      const formattedBalance = cash.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      let stcr = ``;
      if (scheduleN > 0) {
        scheduleRemanescentes = scheduleN - 1;
        stcr = `<div class="central-plus">
    <div class="label-plus">
      <p>
       
Manage your ${scheduleRemanescentes} other <strong class="GreenCard">appointments</strong>
      </p>
    </div>
    <div class="img-plusI">
      <img src="https://img.icons8.com/?size=100&id=T04N1K6ZbCY8&format=png&color=FFFFFF">
    </div>
  </div></div>
    </div>`;
      }
      const renderHtml = `
    <div class="unionE">
      <div class="welcomeDiv"><h1>Welcome back <strong class="consoleWrite">${finder.storeName.replaceAll(
        "/",
        " ",
      )}!</strong></h1><p><strong class="consoleWrite">$</strong>${
        finder.description
      }</p></div>
      <div class="columnUnion">
        <span class="label" style="font-size:0.8em; margin:0 0 2vh 0;">Store opening <strong class="GreenCard">control</strong><strong class="pointer">.</strong></span>
        <div class="weekOpen">${nextDays.slice(0, 4).join("")}</div>
        <div class="weekOpen">${nextDays.slice(4, 8).join("")}</div>
      </div>
    </div>
    <div class="unionE" style="margin: 3vh 0;">
    <div class="dashboardBalance">
      <p class="test">Your <strong class="GreenCard">balance:</strong></p>
        <p class="CASH"><strong class="consoleWrite" style="margin:0;">$</strong>${formattedBalance} <img src="https://img.icons8.com/?size=100&id=85969&format=png&color=FFFFFF" alt=""></p>
    </div>
    <div class="todayAppointments"><p>Today's appointments:</p>
    <p> <strong class="GreenCard" style="margin: 1vw;">${scheduleN
      .toString()
      .padStart(2, "0")}</strong></p></div>
    <div class="localSchedule"data-name="${finder.storeName.replaceAll(
      "/",
      "_",
    )}"><span><strong class="GreenCard">Local</strong> Scheduling</span></div>
    </div>
    <div class="unionE">
    <div class="schedule-union">${htmlArray.slice(0, 2).join("")}
    <!--${stcr}-->
    `;

      return res.status(200).json({
        tudoCerto: ":>",
        finderData: finder,
        outherData: outherFinder,
        returner: renderHtml,
      });
    }

    let cash = basicInfos.totalCash / 100;
    let scheduleRemanescentes = 0;
    let stcr = ``;
    const formattedBalance = cash.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (scheduleN > 0) {
      scheduleRemanescentes = scheduleN - 1;
      stcr = `<div class="central-plus">
    <div class="label-plus">
      <p>
       
Manage your ${scheduleRemanescentes} other <strong class="GreenCard">appointments</strong>
      </p>
    </div>
    <div class="img-plusI">
      <img src="https://img.icons8.com/?size=100&id=T04N1K6ZbCY8&format=png&color=FFFFFF">
    </div>
  </div></div>
    </div>`;
    }
    const renderHtml = `
    <div class="unionE">
      <div class="welcomeDiv"><h1>Welcome back <strong class="consoleWrite">${finder.storeName.replaceAll(
        "/",
        " ",
      )}!</strong></h1><p><strong class="consoleWrite">$</strong>${
        finder.description
      }</p></div>
      <div class="columnUnion">
        <span class="label" style="font-size:0.8em; margin:0 0 2vh 0;">Store opening <strong class="GreenCard">control</strong><strong class="pointer">.</strong></span>
        <div class="weekOpen">${nextDays.slice(0, 4).join("")}</div>
        <div class="weekOpen">${nextDays.slice(4, 8).join("")}</div>
      </div>
    </div>
    <div class="unionE" style="margin: 3vh 0;">
    <div class="dashboardBalance">
      <p class="test">Your <strong class="GreenCard">balance:</strong></p>
        <p class="CASH"><strong class="consoleWrite" style="margin:0;">$</strong>${formattedBalance} <img src="https://img.icons8.com/?size=100&id=85969&format=png&color=FFFFFF" alt=""></p>
    </div>
    <div class="todayAppointments"><p>Today's appointments:</p>
    <p> <strong class="GreenCard" style="margin: 1vw;">${scheduleN
      .toString()
      .padStart(2, "0")}</strong></p></div>
    <div class="localSchedule"data-name="${finder.storeName.replaceAll(
      "/",
      "_",
    )}"><span><strong class="GreenCard">Local</strong> Scheduling</span></div>
    </div>
    <div class="unionE">
    <div class="schedule-union">${htmlArray.slice(0, 1).join("")}
    ${stcr}
    `;

    return res.status(200).json({
      tudoCerto: ":>",
      finderData: finder,
      outherData: outherFinder,
      returner: renderHtml,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.get("/cad/store", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-store.html"));
});
app.get("/services/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-services.html"));
});
app.get("/hour/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-hours.html"));
});
app.get("/functionary/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cad-functionary.html"));
});
app.post("/cadFunctionary", tokenVerify, upload.any(), async (req, res) => {
  const { name, email } = req.user;

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
      })),
    );

    const findStore = await StoreCad.findOne({ name: name, email: email });
    if (!findStore) {
      console.log(name, email);
      return res.status(400).json({
        message: "Loja não encontrada",
        name: name,
        email: email,
      });
    }

    const toArray = (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : []);

    const functionaryName = toArray(
      req.body["functionaryName[]"] ?? req.body.functionaryName,
    );
    const functionaryEmail = toArray(
      req.body["functionaryEmail[]"] ?? req.body.functionaryEmail,
    );

    const files = req.files || [];

    const total =
      Math.max(functionaryName.length, functionaryEmail.length) || 0;

    if (total === 0 && !functionaryName.length && !functionaryEmail.length) {
      return res.status(400).json({ message: "Nenhum funcionário enviado" });
    }

    const imagePaths = [];
    const imageMeta = [];

    // ✅ Loop simples igual ao servicesCad
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const processed = await processImageToWebp(file.buffer, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 80,
        });

        const saved = await saveBufferToDisk(
          processed.buffer,
          processed.format,
          "functionary",
        );

        const imageInfo = {
          storage: "disk",
          path: saved.relPath,
          filename: saved.fileName,
          format: processed.format,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        };

        imagePaths.push(saved.relPath);
        imageMeta.push(imageInfo);
      } catch (imgErr) {
        console.warn("Falha ao processar imagem:", imgErr.message);
        // Adiciona null para manter índice
        imagePaths.push(null);
        imageMeta.push(null);
      }
    }

    console.log("imagePaths final:", imagePaths);
    console.log("imageMeta final:", imageMeta);

    const newFunctionary = await functionaryCad.create({
      name: name,
      email: email,
      storeName: findStore.storeName,
      storeEmail: findStore.storeEmail,
      phone: findStore.phone,
      functionarysName: functionaryName,
      functionarysEmail: functionaryEmail,
      functionaryImagePath: imagePaths,
      functionaryImageMeta: imageMeta,
    });

    console.log(`Criados funcionários. files.length=${files.length}`);

    // ✅ Redireciona igual ao servicesCad
    return res.redirect("/bank/datas");
  } catch (error) {
    console.error("Erro ao cadastrar funcionários:", error);
    return res.status(500).json({
      message: "Erro ao processar o cadastro.",
      error: error.message,
    });
  }
});
app.get(`/store/:storeName`, async (req, res) => {
  const storeName = req.params.storeName;
  const token = req.cookies.authToken;

  if (!token) {
    return res.redirect(`/login-redirect?redirect='/store/${storeName}'`);
  }
  let real = storeName.replaceAll("_", "/");
  console.log(real);
  try {
    const obsolente = await obsolence.findOne({
      storeName: real.replace(":", ""),
    });
    if (!obsolente) {
      return res.sendFile(path.join(__dirname, "public", "base.html"));
    } else {
      return res.redirect("/home.html");
    }
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
});
app.get(`/api/store/:storeName`, tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const storeName = req.params.storeName;
  console.log(storeName);
  let realStoreName = storeName.replaceAll("_", "/");
  realStoreName = realStoreName.replaceAll(":", "");
  const trueName = realStoreName.replaceAll("/", " ");

  try {
    const storeData = await StoreCad.findOne({ storeName: realStoreName });
    if (!storeData) {
      return res.status(404).json({ error: "Not found" });
    }

    const servicesData = await ServicesCad.find({
      storeName: realStoreName,
    }).lean();
    const plansData = await plansSchema
      .findOne({
        storeName: realStoreName,
      })
      .lean();
    console.log(plansData);
    if (!servicesData || servicesData.length == 0) {
      return res.status(404).json({ error: "Services not found" });
    }
    let htmlArray = [];
    let plansArray = [];
    let priceArray = [];
    let count = 0;
    const serviceName = servicesData.map((doc) => doc.serviceName).flat();
    const imgPath = storeData.storeImagePath;
    const timeArr = [];
    for (let i = 0; i < servicesData.length; i++) {
      const servicesDoc = servicesData[i];
      const names = servicesDoc.serviceName;
      const desc = servicesDoc.serviceDesc;
      const prices = servicesDoc.servicePrice;
      const imgPath2 = servicesDoc.serviceImagePath;
      const time = servicesDoc.servicesTime;
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
        priceArray.push(prices[j]);
        timeArr.push(time[j]);
        htmlArray.push(structure);
      }
    }
    if (plansData) {
      const name = plansData.planOriginalName;
      const desc = plansData.planDescription;
      const realName = plansData.planName;
      const price = plansData.planPrice;

      console.log("EU: \n" + name, desc, realName, price);
      for (let pd = 0; pd < name.length; pd++) {
        let priceP = price[pd] / 100;
        let totalPrice = priceP.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        let structure = `
        <div class="Basic Plan ${name[pd].replaceAll(
          " ",
          "-",
        )}" style="opacity: 1; margin: 2vw;" data-name="${
          realName[pd]
        }" data-price="${price[pd]}" data-store="${storeData.storeName}">
          <h1 class="Price"><strong class="GreenCard">$</strong>${totalPrice}</h1>
          <div class="beneficios">
            <h1>${name[pd]}</h1>
            <p><strong class="consoleWrite">>></strong>${desc[pd]}</p>
            <button style="margin-top: 4vh;">Subscribe Now</button>
          </div>
        </div>
        `;
        plansArray.push(structure);
      }
    }
    let servicesReturner = htmlArray.join("");
    let plansReturner = plansArray.join("");
    let planStcr = ``;
    if (plansArray.length > 0) {
      planStcr = `<div class="trasition"></div>
    <section class="Ass-Plan">
      <div class="Text-Plan" style="opacity: 1">
        <h1>Choose Your <strong class="GreenCard">Plan</strong></h1>
      </div>
      <div class="Plans-content" style="opacity: 1">
        ${plansReturner}
      </div>
    </section>`;
    }
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
              <p><strong class="consoleWrite">>_</strong>${
                storeData.description
              }</p>
              <div class="unionE">
                <p class="adressD"><strong class="GreenCard">Adress:</strong> ${
                  storeData.address
                }</p><p class="adressD"><strong class="GreenCard">Contact:</strong> ${storeData.phone
                  .replaceAll("(", "<strong class='jsonWrite'>(</strong>")
                  .replaceAll(")", '<strong class="jsonWrite">)</strong>')}</p>
              </div>
              <div class="hours">
                <div class="openAt">${storeData.openHours}</div>
                <div class="theHourLine"></div>
                <div class="closeAt">${storeData.closedHours}</div>
              
              <div class="functionDays"><div class="placeholder">Closed on days:</div><div class="until">${
                storeData.closedDays
              }</div></div>
              </div>
              <button class="servicesBtn"  id="toThing">Schedule Now</button>
            </div>
          </div>
          
      </section>
      <!--SOMOS DIFERENTES DIVS-->
      <section class="services-content" id="forScrollPreguiçosos">
      ${returnS}
      <div class="selectedIndicator"><span class="counter">Selected services: </span><button>Next<strong class="consoleWrite"> >></strong></button></div>
    </section>
    ${planStcr}
        `;
    console.log(plansReturner);
    const verifyRecurring = await recurring.findOne({
      name: name,
      email: email,
      storeName: realStoreName,
    });
    if (!verifyRecurring) {
      const recurringCreate = await recurring.create({
        name: name,
        email: email,
        storeName: realStoreName,
        totalMoney: 0,
        recurringType: true,
        scheduleNumber: 0,
        planNumber: 0,
        cancelNumber: 0,
      });
      if (!recurringCreate) {
        return res.status(404).json({ error: "ERRO NO RECURRING" });
      }
    }
    return res.status(200).json({
      htmlPage: htmlBasePageModel3,
      services: servicesData,
      store: storeData,
      StoreName: trueName,
      serviceName: serviceName,
      closedDays: storeData.closedDays,
      returner: returnS,
      prices: priceArray,
      time: timeArr,
    });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});
app.get("/pay/plans", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "plans.html"));
});
app.post("/pay/plans/buy", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { plan, price, storeName } = req.body;
  try {
    const storeData = await StoreCad.findOne({
      storeName: storeName,
    });
    if (!storeData) {
      return res.status(404).json({ error: "ERROR in payment IN STORE :(" });
    }
    const bankData = await BankSchema.findOne({
      name: storeData.name,
      email: storeData.email,
    });
    if (!bankData) {
      return res.status(404).json({ error: "ERROR in payment IN BANK :(" });
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: [
        "card", // Cartão de crédito/débito
      ],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: plan,
            },
            unit_amount: price / 100,
            recurring: {
              // ✅ OBRIGATÓRIO para subscription
              interval: "month", // ou 'year', 'week', 'day'
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        // application_fee_percent: 1, // 7% sua taxa
        transfer_data: {
          destination: bankData.stripe_id, // Conta do lojista
        },
        metadata: {
          store_id: storeData.id,
          user_name: name,
          user_email: email,
        },
      },
      success_url: `https://xbtl8ft1-3000.brs.devtunnels.ms/cad/plan?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel/payment`,
      customer_email: email,
      metadata: {
        userId: req.user.id,
        planName: plan,
        userName: name,
        userEmail: email,
        planPrice: price,
      },
    });
    if (!session) {
      return res.status(400).json({ error: "ERROR in payment :(" });
    }

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return res.status(500).json({
      error: "Erro ao processar pagamento",
      details: error.message,
    });
  }
});
app.get("/cad/plan", async (req, res) => {
  const sessionId = req.query.session_id;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const { planName, userName, userEmail, planPrice } = session.metadata;

    if (session.payment_status === "paid") {
      const planVerify = await userPlansSchema.findOne({
        planName: planName,
        name: userName,
      });

      if (planVerify) {
        return res.status(200).json({
          error: "ENCONTRADO",
        });
      }

      const parts = planName.split(":");
      const plan = parts[1];
      const store = parts[0];
      const dbStore = store.replaceAll(" ", "/");
      const findData = await plansSchema.findOne({
        storeName: dbStore,
      });
      if (!findData) {
        return res.status(400).json({ error: "Na verficação" });
      }

      const verify = await store_data_schema.findOne({
        storeName: findData.storeName,
      });
      if (!verify) {
        return res.status(400).json({ error: "Na verficação 2" });
      }
      const mtp = await recurring.findOne({
        name: userName,
        email: userEmail,
        storeName: findData.storeName,
      });
      if (!mtp) {
        return res.status(400).json({ error: "Na verficação 3" });
      }
      mtp.planNumber += 1;
      await mtp.save();
      const att = await store_data_schema.findOneAndUpdate(
        {
          storeName: verify.storeName,
        },
        {
          totalCash: verify.totalCash + parseInt(planPrice / 100),
          planNumber: (verify.planNumber += 1),
          money: verify.money + parseInt(planPrice),
        },
      );
      if (!att) {
        return res.status(400).json({ error: "Na ganhação de money " });
      }
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth();
      const year = today.getFullYear();
      const query = `${day}/${month}/${year}`;
      const planCad = await userPlansSchema.create({
        name: userName,
        email: userEmail,
        planName: planName,
        planPrice: planPrice / 100,
        subscriptionId: session.subscription,
        subscritionDay: query,
      });
      if (!planCad) {
        return res.status(400).json({
          error: "NO CADASTRO",
        });
      }
      return res.redirect("/my/plan");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "NO SERVIDOR",
    });
  }
});
app.delete("/bad/payer", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const store = await StoreCad.findOne({
      name: name,
      email: email,
    }).lean();
    if (store) {
      const servicesDeleter = await ServicesCad.findOneAndDelete({
        name: name,
        email: email,
      });
      if (servicesDeleter) {
        const hourDeleter = await HoursStorage.findOneAndDelete({
          storeName: store.storeName,
          storeEmail: store.storeEmail,
        });
        if (hourDeleter) {
          const funcDeleter = await functionaryCad.findOneAndDelete({
            name: name,
            email: email,
          });
          if (funcDeleter) {
            const storeDeleter = await StoreCad.findOneAndDelete({
              name: name,
              email: email,
            });
            if (!storeDeleter) {
              return res
                .status(400)
                .json({ error: "errooooooooooooooooooooooooooooooooooooor" });
            }
          }
        }
      }
    }

    return res.status(200).json({ sucess: "SUCESS" });
  } catch (error) {
    return res.status(500).json({ error: error });
  }
});
app.get("/store/plans", tokenVerify, async (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "plansData.html"));
});
app.post("/plans/register/bank", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { holder_name, holder_type, bank_code, branch_code, account_number } =
    req.body;
  console.log("📦 Dados recebidos:", {
    holder_name,
    holder_type,
    bank_code,
    branch_code,
    account_number,
  });
  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: holder_type,
      metadata: {
        userId: req.user.id,
        userName: name,
        isTestAccount: "true",
      },
    });
    const externalAccount = await stripe.accounts.createExternalAccount(
      account.id,
      {
        external_account: {
          object: "bank_account",
          country: "BR",
          currency: "brl",
          account_holder_name: holder_name,
          account_holder_type: holder_type, // ou 'company'
          routing_number: `${bank_code}-${branch_code}`,
          account_number: account_number,
          // account_type: "checking",
        },
      },
    );
    const registerData = {
      holder_name: holder_name,
      holder_type: holder_type,
      bank_code: `${bank_code}-${branch_code}`,
      account_number: account_number,
      stripe_id: account.id,
    };
    console.log(registerData);
    const bankDatas = await BankSchema.findOne({
      holder_name: registerData.holder_name,
      stripe_id: registerData.stripe_id,
    });
    if (!bankDatas) {
      const criptNumber = criptografar(account_number.toString());
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `http://localhost:3000/bank/datas`, // URL se expirar
        return_url: `http://localhost:3000/stores/home`, // URL após completar
        type: "account_onboarding",
        collect: "currently_due",
      });
      const cadBankDatas = await BankSchema.create({
        name: name,
        email: email,
        holder_name: holder_name,
        holder_type: holder_type,
        bank_code: bank_code,
        branch_code: branch_code,
        stripe_id: account.id,
        account_number: criptNumber,
        active: false,
      });
      if (cadBankDatas) {
        return res.redirect(accountLink.url);
      }
    }
    return res.status(404).json({ error: "Usuario ja cadastrado" });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/plans/register/plans", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { name_product, price_product, description } = req.body;

  console.log("📦 Cadastro de Plans - Dados recebidos:");
  console.log("name_product:", name_product);
  console.log("price_product:", price_product);
  console.log("description:", description);

  try {
    const findYourStore = await StoreCad.findOne({
      name: name,
      email: email,
    });

    if (!findYourStore) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    let storeName = findYourStore.storeName.replaceAll("/", " ");
    let productInStripeNameArray = [];
    const stripeId = [];
    const pricesInCents = []; // ✅ Array para salvar preços em centavos
    const planCode = findYourStore.model;

    // ============================================
    // PROCESSAR MÚLTIPLOS PLANS
    // ============================================
    if (Array.isArray(name_product)) {
      for (let i = 0; i < name_product.length; i++) {
        const productInStripeName = `${storeName}:${name_product[i]}:${findYourStore.model}`;

        // ✅ CORREÇÃO: Converter vírgula para ponto
        const priceStr = String(price_product[i]).trim().replace(",", ".");
        const priceValue = parseFloat(priceStr);

        // Validar
        if (isNaN(priceValue) || priceValue <= 0) {
          console.error(`❌ Preço inválido no índice ${i}:`, price_product[i]);
          return res.status(400).json({
            error: `Preço inválido para "${name_product[i]}": ${price_product[i]}`,
          });
        }

        const unitAmount = Math.round(priceValue * 100);
        console.log(
          `💰 Plan ${i}: ${name_product[i]} = R$ ${priceValue.toFixed(
            2,
          )} (${unitAmount} centavos)`,
        );

        // Validar description
        const productDescription =
          description[i] && String(description[i]).trim() !== ""
            ? description[i]
            : "Plano de assinatura"; // Valor padrão

        // Criar produto no Stripe
        const stripeProduct = await stripe.products.create({
          name: productInStripeName,
          description: productDescription,
          metadata: {
            storeOwner: name,
            ownerEmail: email,
          },
        });

        // Criar preço no Stripe
        const stripeProductPrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: unitAmount,
          currency: "brl",
          recurring: {
            interval: "month",
          },
        });

        stripeId.push(stripeProduct.id);
        productInStripeNameArray.push(productInStripeName);
        pricesInCents.push(unitAmount); // ✅ Salvar em centavos
      }
    }
    // ============================================
    // PROCESSAR PLAN ÚNICO
    // ============================================
    else {
      const productInStripeName = `${storeName}:${name_product}:${findYourStore.model}`;

      // ✅ CORREÇÃO: Converter vírgula para ponto
      const priceStr = String(price_product).trim().replace(",", ".");
      const priceValue = parseFloat(priceStr);

      // Validar
      if (isNaN(priceValue) || priceValue <= 0) {
        console.error("❌ Preço inválido:", price_product);
        return res.status(400).json({
          error: `Preço inválido: ${price_product}`,
        });
      }

      const unitAmount = Math.round(priceValue * 100);
      console.log(
        `💰 Plan único: ${name_product} = R$ ${priceValue.toFixed(
          2,
        )} (${unitAmount} centavos)`,
      );

      // Validar description
      const productDescription =
        description && String(description).trim() !== ""
          ? description
          : "Plano de assinatura"; // Valor padrão

      // Criar produto no Stripe
      const stripeProduct = await stripe.products.create({
        name: productInStripeName,
        description: productDescription,
        metadata: {
          storeOwner: name,
          ownerEmail: email,
        },
      });

      // Criar preço no Stripe
      const stripeProductPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: unitAmount,
        currency: "brl",
        recurring: {
          interval: "month",
        },
      });

      stripeId.push(stripeProduct.id);
      productInStripeNameArray.push(productInStripeName);
      pricesInCents.push(unitAmount); // ✅ Salvar em centavos
    }

    // ============================================
    // VERIFICAR SE JÁ EXISTE
    // ============================================
    const verify = await plansSchema.findOne({
      storeName: findYourStore.storeName,
      planName: { $in: productInStripeNameArray },
    });

    if (verify) {
      return res.status(400).json({ error: "Plano já existe" });
    }

    // ============================================
    // CADASTRAR NO BANCO
    // ============================================
    console.log("💾 Salvando no DB:", {
      planName: productInStripeNameArray,
      planPrice: pricesInCents,
      planOriginalName: Array.isArray(name_product)
        ? name_product
        : [name_product],
    });

    const cadInDB = await plansSchema.create({
      name: name,
      email: email,
      storeName: findYourStore.storeName,
      planCode: planCode,
      planName: productInStripeNameArray,
      planOriginalName: Array.isArray(name_product)
        ? name_product
        : [name_product],
      planPrice: pricesInCents, // ✅ SALVAR EM CENTAVOS
      planDescription: Array.isArray(description) ? description : [description],
      planStripeCode: stripeId,
    });

    if (!cadInDB) {
      return res.status(400).json({ error: "Erro ao cadastrar no banco" });
    }

    console.log("✅ Plans cadastrados com sucesso!");
    return res.status(200).redirect("/store-plans");
  } catch (error) {
    console.error("❌ Erro no cadastro:", error);
    return res.status(500).json({
      error: "Erro no servidor",
      msg: error.message,
    });
  }
});

app.get("/pay/app/:scheduleId", tokenVerify, async (req, res) => {
  const scheduleId = req.query.scheduleId;
  try {
    const verify = await scheduleSchema.findOne({
      id: scheduleId,
    });
    if (!verify) {
      return res.status(404).json({
        erro: "Verify",
      });
    }
    const verificador = await store_data_schema.findOne({
      storeName: verify.storeName,
    });
    if (!verificador) {
      return res.status(404).json({
        erro: "Verificador",
      });
    }
    if (verificador.prePayment) {
      return res.sendFile(path.join(__dirname, "public", "paywithapp.html"));
    } else {
      return res.redirect("/schedule/home");
    }
  } catch (error) {}
});
app.post("/pay/schedule", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { id } = req.body;
  const findSchema = await scheduleSchema.findById(id);
  if (!findSchema) {
    return res.status(404).json({ erro: "SCHEDULE N ENCONTRADO" });
  }
  const price = findSchema.totalPrice;
  const description = "Pay via App";
  const product_name = `Pay Via App : ${JSON.stringify(
    criptografar(generateCode()).authTag,
  )}`;

  try {
    const findStore = await StoreCadschema.findOne({
      storeName: findSchema.storeName,
    });
    if (!findStore) {
      console.log("n possui loja")
      return res.status(400).json({
        error: "Loja não ENCONTRADA",
      });
    }
    const bankData = await BankSchema.findOne({
      name: findStore.name,
      email: findStore.email,
      active: true,
    });

    if (!bankData) {
      console.log('n possui banco')
      return res.status(400).json({
        error: "Loja não possui dados bancários",
      });
    }
    const stripeProduct = await stripe.products.create({
      name: product_name,
      description: description,
      metadata: {
        storeOwner: name,
        ownerEmail: email,
      },
    });
    const stripeProductPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: price,
      currency: "brl",
    });
    const applicationFeeAmount = Math.floor(price * 0.03);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: [
        "card", // Cartão de crédito/débito
        "boleto", // Boleto (Brasil)
        //"pix", // PIX (Brasil) 🔥
      ],
      //expires_at: Math.floor(Date.now() / 1000) + (60 * 60 * 2),
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: product_name,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      payment_method_options: {
        boleto: {
          expires_after_days: 3,
        },
      },
      payment_intent_data: {
        transfer_data: {
          destination: bankData.stripe_id,
        },
        metadata: {
          schedule_id: id,
          user_name: name,
          user_email: email,
        },
      },

      success_url: `https://xbtl8ft1-3000.brs.devtunnels.ms/schedule/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/cancel/payment`,
      customer_email: email,
      metadata: {
        userId: req.user.id,
        userName: name,
        scheduleId: id,
      },
      locale: "pt-BR", // ✅ Interface em português
      billing_address_collection: "required", // ✅ Obrigatório para boleto
    });
    if (!session) {
      return res.status(400).json({ error: "ERROR in payment :(" });
    }
    const updateStripeId = await scheduleSchema.findByIdAndUpdate(id, {
      stripeId: session.id,
    });
    if (!updateStripeId) {
      return res.status(400).json({ error: "erro ao atualizar stripeId" });
    }
    return res.status(200).json({
      checkoutUrl: session.url, // ✅ URL para redirecionar
      sessionId: session.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "erro no servidor", msg: error });
  }
});
app.get("/schedule/success", async (req, res) => {
  const session_id = req.query.session_id;
  try {
    const status = await stripe.checkout.sessions.retrieve(session_id);

    if (status.payment_status === "paid") {
      const find = await scheduleSchema.findOneAndUpdate(
        { stripeId: session_id },
        {
          payed: true,
        },
      );
      if (!find) {
        return res.status(404).json({ error: "n encontrado" });
      }
      const findOne = await store_data_schema.findOne({
        storeName: find.storeName,
      });
      if (!findOne) {
        return res.status(404).json({ error: "n encontrado" });
      }
      console.log(findOne.totalCash + find.totalPrice);
      const updt = await store_data_schema.findOneAndUpdate(
        {
          storeName: find.storeName,
        },
        {
          totalCash: findOne.totalCash + parseInt(find.totalPrice),
          totalAppointmentsPayed: findOne.totalAppointmentsPayed + 1,
          money: findOne.money + find.totalPrice,
        },
      );
      if (!updt) {
        return res.status(400).json({ error: "ao encontrar" });
      }
      const mtp = await recurring.findOne({
        name: find.name,
        email: find.email,
        storeName: find.storeName,
      });
      if (!mtp) {
        return res.status(400).json({ error: "ao encontrar" });
      }
      mtp.scheduleNumber += 1;
      mtp.totalMoney += find.totalPrice;
      await mtp.save();
      let msg = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            background: linear-gradient(135deg, #0d0d0d 0%, #042326 100%);
            min-height: 100vh;
            padding: 20px;
            color: #f2f2f2;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: rgba(13, 13, 13, 0.8);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(166, 166, 166, 0.2);
        }

        .header {
            background: linear-gradient(135deg, #238c6e 0%, #1a6b54 100%);
            padding: 30px 20px;
            text-align: center;
            position: relative;
        }

        .success-icon {
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
        }

        .header h1 {
            font-size: clamp(20px, 5vw, 28px);
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 8px;
        }

        .header p {
            font-size: clamp(14px, 3vw, 16px);
            color: rgba(255, 255, 255, 0.9);
        }

        .content {
            padding: 30px 20px;
        }

        .greeting {
            margin-bottom: 24px;
        }

        .greeting h2 {
            font-size: clamp(18px, 4vw, 24px);
            margin-bottom: 8px;
        }

        .greeting .highlight {
            color: #238c6e;
        }

        .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #238c6e 0%, #1a6b54 100%);
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: clamp(13px, 3vw, 14px);
            font-weight: 600;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-card {
            background-color: rgba(35, 140, 110, 0.1);
            border: 1px solid rgba(35, 140, 110, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .info-row {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .info-row:last-child {
            margin-bottom: 0;
        }

        .info-label {
            font-size: clamp(13px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.7);
            margin-bottom: 4px;
            width: 100%;
        }

        .info-value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: 600;
            color: #238c6e;
            word-break: break-word;
        }

        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 16px;
            margin-top: 20px;
        }

        .detail-box {
            background-color: rgba(35, 140, 110, 0.08);
            border: 1px solid rgba(166, 166, 166, 0.15);
            border-radius: 10px;
            padding: 16px;
            text-align: center;
        }

        .detail-box .label {
            font-size: clamp(12px, 3vw, 13px);
            color: rgba(242, 242, 242, 0.6);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .detail-box .value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: 700;
            color: #238c6e;
        }

        .payment-summary {
            background: linear-gradient(135deg, rgba(35, 140, 110, 0.15) 0%, rgba(35, 140, 110, 0.05) 100%);
            border: 2px solid rgba(35, 140, 110, 0.4);
            border-radius: 12px;
            padding: 24px 20px;
            margin-top: 24px;
            text-align: center;
        }

        .payment-summary .total-label {
            font-size: clamp(13px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.7);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .payment-summary .total-value {
            font-size: clamp(28px, 7vw, 36px);
            font-weight: 900;
            color: #238c6e;
            text-shadow: 0 2px 10px rgba(35, 140, 110, 0.3);
        }

        .footer {
            padding: 20px;
            text-align: center;
            border-top: 1px solid rgba(166, 166, 166, 0.15);
        }

        .footer p {
            font-size: clamp(12px, 3vw, 14px);
            color: rgba(242, 242, 242, 0.5);
        }

        /* Responsiveness */
        @media only screen and (max-width: 480px) {
            body {
                padding: 10px;
            }

            .container {
                border-radius: 12px;
            }

            .header {
                padding: 24px 16px;
            }

            .success-icon {
                width: 50px;
                height: 50px;
                font-size: 28px;
            }

            .content {
                padding: 24px 16px;
            }

            .info-card {
                padding: 16px;
            }

            .details-grid {
                grid-template-columns: 1fr;
                gap: 12px;
            }

            .detail-box {
                padding: 14px;
            }

            .payment-summary {
                padding: 20px 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✓</div>
            <h1>💰 Payment Confirmed</h1>
            <p>The appointment has been successfully paid</p>
        </div>

        <div class="content">
            <div class="greeting">
                <h2>Hello, <span class="highlight">${
                  find.functionary
                }</span>!</h2>
                <p style="color: rgba(242, 242, 242, 0.8); margin-top: 8px;">
                    Great news! The appointment for <strong style="color: #238c6e;">${
                      find.name
                    }</strong> has been paid.
                </p>
            </div>

            <div style="text-align: center;">
                <span class="status-badge">✓ Paid</span>
            </div>

            <div class="info-card">
                <div class="info-row">
                    <span class="info-label">👤 Client</span>
                    <span class="info-value">${find.name}</span>
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-box">
                    <div class="label">📅 Date</div>
                    <div class="value">${find.day}</div>
                </div>

                <div class="detail-box">
                    <div class="label">🕒 Time</div>
                    <div class="value">${find.hour}</div>
                </div>
            </div>

            <div class="payment-summary">
                <div class="total-label">Total Paid</div>
                <div class="total-value">$${find.totalPrice / 100}</div>
            </div>
        </div>

        <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p style="margin-top: 8px;">© 2025 Your Appointment System</p>
        </div>
    </div>
</body>
</html>`;
      const verifyEmail = await functionaryCad.findOne({
        storeName: find.storeName,
      });
      if (!verifyEmail) {
        console.error("error");
        return res.status(404).json({
          error: error,
        });
      }
      //functionaryEmail(verifyEmail.functionarysEmail, msg);
      return res.redirect("/schedule/home");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.get("/my/plan", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "myplans.html"));
});
app.get("/return/data/plans", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  let havePlans = false;
  const finder = await userPlansSchema
    .find({
      name: name,
      email: email,
    })
    .lean();
  let htmlArray = [];
  if (finder.length === 0) {
    let structure = `<div class="notAllowed">
  <div class="call-action">
    <h1 class="call-h1">
      No plans <strong class="GreenCard">found</strong><strong class="pointer">,</strong>
    </h1>
    <p class="call-p">Create subscription plans at your favorite stores.</p>
  </div>

  <div class="central-plus">
    <div class="label-plus">
      <p>
        Subscribe <strong class="GreenCard">Now</strong>
      </p>
    </div>
    <div class="img-plus">
      <img src="https://img.icons8.com/?size=100&id=95779&format=png&color=FFFFFF">
    </div>
  </div>
</div>`;
    htmlArray.push(structure);
  } else {
    for (let i = 0; i < finder.length; i++) {
      const planName = finder[i].planName;
      const planPrice = finder[i].planPrice;
      const parts = planName.split(":");
      const plan = parts[1];
      const store = parts[0];
      const dbStore = store.replaceAll(" ", "/");
      let div = `<div class="columnUnion planColumnUnion">
        <div class="myPlan"><div class="plan-name">${plan}<div class="store-name-plan"><strong class="consoleWrite">#</strong>${store}</div><br></div><div class="plan-price"><strong class="consoleWrite">$</strong>${(
          planPrice / 100
        ).toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}</div></div>
        <div class="cancel-plan"  data-name="${planName}" data-store="${dbStore}">Cancel Plan</div>
      </div>
      `;
      htmlArray.push(div);
      havePlans = true;
    }
  }
  if (havePlans) {
    return res.status(200).json({
      data: finder,
      html: `<div class="marginer">${htmlArray.join("")}</div>
      >`,
    });
  } else {
    return res.status(200).json({
      data: finder,
      html: htmlArray.join(""),
    });
  }
});
app.post("/cancel/plan", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { plan, store } = req.body;

  console.log("=== CANCEL PLAN DEBUG ===");
  console.log("User:", { name, email });
  console.log("Body:", { plan, store });
  try {
    const findId = await userPlansSchema
      .findOne({
        name: name,
        email: email,
        planName: plan,
      })
      .lean();
    console.log("FindId result:", findId);
    console.log("Cancelling plan:", { name, email, plan, store }); // ✅ Log
    if (!findId) {
      return res.status(400).json({ error: "IN VERIFY SUBSCRIPTION" });
    }
    let planId = findId.subscriptionId;
    const cancel = await stripe.subscriptions.cancel(planId);
    const fvp = await store_data_schema.findOne({
      storeName: store,
    });
    if (!fvp) {
      return res.status(404).json({ error: "IN FVP" });
    }
    fvp.totalCash -= findId.planPrice;
    fvp.money -= findId.planPrice;
    await fvp.save();
    const mtp = await recurring.findOne({
      name: name,
      email: email,
      storeName: store,
    });
    if (!mtp) {
      return res.status(404).json({ error: "IN MTP" });
    }
    mtp.planNumber -= 1;
    await mtp.save();
    const deleter = await userPlansSchema.findOneAndDelete({
      name: name,
      email: email,
      planName: plan,
    });
    if (!deleter) {
      return res.status(400).json({ error: "In delete The plan" });
    }
    return res.status(200).json({ success: "sucess" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "ERROR IN THE SERVER" });
  }
});
app.get("/payment-policy", tokenVerify, (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "paymentpolicy.html"));
});
app.get("/refund-policy", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "refund.html"));
});
app.get("/store-plans", tokenVerify, (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "store-plans.html"));
});
app.get("/render/stores/plan", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  let htmlArray = [];
  let havePlan = false;
  let emailArray = [];
  try {
    const find = await plansSchema
      .find({
        name: name,
        email: email,
      })
      .lean();
    console.log(find);
    if (!find) {
      return res.status(404).json({ error: "IN FIND BRO" });
    }

    if (find.length === 0) {
      let html = `<div class="notAllowed">
  <div class="call-action">
    <h1 class="call-h1">
      No plans <strong class="GreenCard">found</strong><strong class="pointer">,</strong>
    </h1>
    <p class="call-p">Create subscription plans for your store, for "free" For more informations go in <a href="/payment-policy" class="GreenCard">Payment-Policy.</a></p>
  </div>

  <div class="central-plus">
    <div class="label-plus">
      <p>
        Subscribe <strong class="GreenCard">Now</strong>
      </p>
    </div>
    <div class="img-plus">
      <img src="https://img.icons8.com/?size=100&id=95779&format=png&color=FFFFFF">
    </div>
  </div>
</div>`;
      htmlArray.push(html);
    } else {
      for (let i = 0; i < find.length; i++) {
        const planName = find[i].planOriginalName;
        const store = find[i].storeName;
        const plan = find[i].planName;
        const price = find[i].planPrice;
        for (let j = 0; j < planName.length; j++) {
          let html = `<div class="columnUnion">
        <div class="myPlan"><div class="plan-name">${
          planName[j]
        }<div class="store-name-plan"><strong class="consoleWrite">#</strong>${store.replaceAll(
          "/",
          " ",
        )}</div><br></div><div class="plan-price"><strong class="consoleWrite">$</strong>${(
          price[j] / 100
        ).toLocaleString("pt-BR", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}</div></div>
        <div class="cancel-plan"  data-name="${
          plan[j]
        }" data-store="${store}" data-index="${i}" data-code="${
          find[i].planCode
        }">Delete Plan</div>
      </div>`;
          htmlArray.push(html);
          havePlan = true;
          console.log(plan[j])
          const findUser = await userPlansSchema.find({
            planName: plan[j]
          });
          console.log(findUser)
          if (findUser) {
            for (let k = 0; k < findUser.length; k++) {
              const nameC = findUser[k].name;
              const emailC = findUser[k].email;
              const planC = findUser[k].planName;
              const plani = planC.split(":");
              const planNamer = plani[1];
              let emailH = `<div class="plansNamers">
               <div class="planColumn">
                 <div class="PlanNamer">${nameC}</div>
                               <div class="PlanEmail">${emailC}</div>
               </div>
              <div class="PlanType">${planNamer}</div>
            </div>`;
              emailArray.push(emailH);
              console.log(emailC, nameC);
            }
          }
        }
      }
    }
    if (havePlan) {
      const today = new Date();
      const date = today.getDate().toString().padStart(2, "0");
      const month = today.getMonth() + 1;
      const monthR = month.toString().padStart(2, "0");
      const year = today.getFullYear();
      return res.status(200).json({
        data: find,
        html: `<div class="unionE">
          <div class="Identifire" style="margin-bottom:5vh;">
              <h1>Your Store <strong class="GreenCard">Plans</strong></h1>
              <p><strong class="consoleWrite">//</strong>View subscription plans and subscribers<strong class="pointer">.</strong></p>
            </div>
          <div class="dateNasc">
      <span class="label">Today <strong class="GreenCard">is</strong></span><br>
      <span class="dateSpan">${date}/${monthR}/${year}</span>
      </div>
        </div><div class="marginer">${htmlArray.join(
          "",
        )}</div><section class="emailSect">
          <div class="emailDiver">${emailArray.join("")}</div>
        </section>`,
      });
    } else {
      return res.status(200).json({
        data: find,
        html: htmlArray.join(""),
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      erro: error,
    });
  }
});
app.post("/delete/plan", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { plan, store, index, code } = req.body;
  console.log(plan, store, index, code);
  try {
    const findStripeId = await plansSchema.findOne({
      name: name,
      email: email,
    });
    console.log(findStripeId);
    if (!findStripeId) {
      console.log(findStripeId);
      return res.status(404).json({ error: "NA verificação basica" });
    }
    const stripeId = findStripeId.planStripeCode[index];
    const prices = await stripe.prices.list({
      product: stripeId,
      limit: 100,
    });

    const priceIds = prices.data.map(price => price.id)

    for (const priceId of priceIds) {
      const subscriptions = await stripe.subscriptions.list({
        price: priceId,
        status: 'active',
        limit: 100,
      })
      for (const subscription of subscriptions.data){
        await stripe.subscriptions.cancel(subscription.id);
        console.log(`Assinatura ${subscription.id} cancelada`);
      }
    }


    for (const price of prices.data) {
      if (price.active) {
        await stripe.prices.update(price.id, {
          active: false,
        });
      }
    }
    console.log('planName:'+  findStripeId.planName[index] +
      'planPrice: ' + findStripeId.planPrice[index])
    const deleteUserPlans = await userPlansSchema.deleteMany({
      planName: findStripeId.planName[index],
      planPrice: findStripeId.planPrice[index]
    })
    if (deleteUserPlans.deletedCount === 0){
      console.log("DELETE USER PLANS")
      return res.status(400).json({
        error: "DELETEUSERPLANS"
      })
    }
    //const deleteProduct = await stripe.products.del(stripeId);
    findStripeId.planName.splice(index, 1);
    findStripeId.planOriginalName.splice(index, 1);
    findStripeId.planPrice.splice(index, 1);
    findStripeId.planDescription.splice(index, 1);
    findStripeId.planStripeCode.splice(index, 1);

    await findStripeId.save();
    if (findStripeId.planName.length === 0) {
      const deleter = await plansSchema.findOneAndDelete({
        name: name,
        email: email,
        storeName: store,
      });
      if (!deleter) {
        console.log("error no deleter");
        return res.status(400).json({
          error: "ERROR AO DELETAR ESSA JOSSA",
        });
      }
      return res.status(200).json({
        ok: "OK",
      });
    }
    return res.status(200).json({
      ok: "OK",
    });
  } catch (error) {
    return res.status(500).json({
      error: error,
    });
  }
});
app.delete("/pass/store", tokenVerify, async (req, res) => {
  const { dia, hora, loja, funcionario, nameC, emailC } = req.body;

  try {
    const realName = loja.replaceAll(" ", "/");
    console.log(realName, nameC, emailC, funcionario, hora, dia);
    const deleter = await scheduleSchema.findOneAndDelete({
      name: nameC,
      email: emailC,
      functionary: funcionario,
      hour: hora,
      day: dia,
      storeName: realName,
    });
    if (!deleter) {
      console.log("404");
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
app.post("/choice/closed-day", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { day } = req.body;

  try {
    const fvp = await store_data_schema.findOne({
      name: name,
      email: email,
    });
    console.log(day, fvp);
    if (!fvp) {
      return res.status(404).json({
        errror: "EM FVP",
      });
    }
    if (fvp.closedChoice.includes(day)) {
      return res.status(200).json({
        errror: "EM DAY",
      });
    }
    fvp.closedChoice.push(day);
    await fvp.save();
    return res.status(200).json({
      sucess: "sucesss",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errror: "No server",
      er: error,
    });
  }
});
app.post("/remove/closed-day", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { day } = req.body;

  try {
    const fvp = await store_data_schema.findOne({
      name: name,
      email: email,
    });
    console.log(day, fvp);
    if (!fvp) {
      return res.status(404).json({
        errror: "EM FVP",
      });
    }
    if (!fvp.closedChoice.includes(day)) {
      return res.status(200).json({
        errror: "EM DAY",
      });
    }
    let index = fvp.closedChoice.indexOf(day);
    fvp.closedChoice.splice(index, 1);
    await fvp.save();
    return res.status(200).json({
      sucess: "sucesss",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errror: "No server",
      er: error,
    });
  }
});
app.delete("/backMyMoney/me", async (req, res) => {
  const { dia, hora, loja, funcionario, nameC, emailC } = req.body;

  try {
    const realName = loja.replaceAll(" ", "/");
    console.log(nameC, emailC);
    const finder = await scheduleSchema.findOne({
      name: nameC,
      email: emailC,
      functionary: funcionario,
      hour: hora,
      day: dia,
      storeName: realName,
    });
    if (!finder) {
      console.log("me");
      return res.status(404).json({
        error: "Error 404, server error man, que merda",
      });
    }
    if (finder.payed) {
      const f = await store_data_schema.findOne({
        storeName: realName,
      });
      if (!f) {
        console.log("eu");
        return res.status(404).json({
          error: "Error 404, server error man, que merda",
        });
      }
      const value = await store_data_schema.findOneAndUpdate(
        {
          storeName: realName,
        },
        {
          totalCash: f.totalCash - finder.totalPrice,
        },
      );
      if (!value) {
        console.log("tu");
        return res.status(400).json({
          error: "Error 400, server error man, que merda",
        });
      }
      const reembolsoTotal = await reembolso.create({
        name: nameC,
        email: nameC,
        storeName: realName,
        totalPrice: finder.totalPrice,
      });
      if (!reembolsoTotal) {
        return res.status(400).json({
          error: "Error 400, server error man, que merda",
        });
      }
    }
    const deleter = await scheduleSchema.findOneAndDelete({
      name: nameC,
      email: emailC,
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
app.get("/stores/analitics", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "analitics.html"));
});
app.get("/analitics", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const analiticsPush = await store_data_schema.findOne({
      name: name,
      email: email,
    });
    if (!analiticsPush) {
      return res.status(404).json({
        error: "N ENCONTRADO BRO",
      });
    }
    const recurringPush = await recurring
      .find({
        storeName: analiticsPush.storeName,
      })
      .lean();
    if (!recurringPush) {
      return res.status(404).json({
        error: "N ENCONTROU NADA O BETINHA",
      });
    }
    const Cash = analiticsPush.totalCash / 100;
    const visitantes = analiticsPush.totalVisits;
    const dateNasc = analiticsPush.createdAt.split(",");
    const totalAppointmentsPayed = analiticsPush.totalAppointmentsPayed;
    const totalAppointments = analiticsPush.totalAppointments;
    let planNumber = 0;
    const storeName = analiticsPush.storeName;
    let gastosArray = [];
    let scheduleCancel = [];
    let scheduleNumberArray = [];
    const planN = await plansSchema.findOne({
      name: name,
      email: email,
    });
    if (planN) {
      planNumber = analiticsPush.planNumber;
    }
    if (recurringPush.length > 1) {
      for (let i = 0; i < recurringPush.length; i++) {
        let totalMoney = recurringPush[i].totalMoney;
        let cancelNumber = recurringPush[i].cancelNumber;
        let scheduleNumber = recurringPush[i].scheduleNumber;
        gastosArray.push(totalMoney);
        scheduleCancel.push(cancelNumber);
        scheduleNumberArray.push(scheduleNumber);
      }
    } else {
      let totalMoney = recurringPush[0].totalMoney;
      let cancelNumber = recurringPush[0].cancelNumber;
      let scheduleNumber = recurringPush[0].scheduleNumber;
      gastosArray.push(totalMoney);
      scheduleCancel.push(cancelNumber);
      scheduleNumberArray.push(scheduleNumber);
    }
    console.log(gastosArray);
    console.log("---------------------------------------");
    console.log(scheduleCancel);
    console.log("---------------------------------------");
    console.log(scheduleNumberArray);
    console.log("---------------------------------------");
    const gastosArrayDivisor = gastosArray.length;
    const gastosArraySoma = gastosArray.reduce((acumulador, valorAtual) => {
      return acumulador + valorAtual;
    }, 0);
    const gastosMedios = gastosArraySoma / gastosArrayDivisor;
    console.log(gastosArraySoma);
    console.log(gastosMedios / 100);
    const scheduleCancelSoma = scheduleCancel.reduce(
      (acumulador, valorAtual) => {
        return acumulador + valorAtual;
      },
      0,
    );
    const scheduleNumberSoma = scheduleNumberArray.reduce(
      (acumulador, valorAtual) => {
        return acumulador + valorAtual;
      },
      0,
    );
    const mediaDeCancelamentos =
      (scheduleCancelSoma / scheduleNumberSoma) * 100;
    console.log(mediaDeCancelamentos);
    console.log(dateNasc);
    const formattedBalance = Cash.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const realGastos = gastosMedios / 100;
    const formatGastos = realGastos.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumSignificantDigits: 2,
    });
    let mediaDePrePagamentos =
      totalAppointments > 0
        ? (totalAppointmentsPayed / totalAppointments) * 100
        : 0;
    let structure = `
    <div class="unionE">
      <div class="Identifire">
        <h1>Analytics <strong class="GreenCard">Dashboard</strong></h1>
        <p>Monitor your <strong class="GreenCard">store</strong> metrics and customer engagement<strong class="pointer">.</strong></p>
      </div>
      <div class="dateNasc">
      <span class="label">Created <strong class="GreenCard">in</strong></span><br>
      <span class="dateSpan">${dateNasc[0]}</span>
      </div>
    </div>
    <div class="unionE bottomPortraitMargin">
    <div class="analyticsInfo"><span class="label">Pending <strong class="GreenCard">Collection:</strong> </span><br><span class="pricer">${formattedBalance}</span></div>
    <div class="analyticsInfo"><span class="label"><strong class="GreenCard">Total</strong> visitors  </span><br><span class="Numbera">${visitantes}</span></div>
    <div class="analyticsInfo"><span class="label"><strong class="GreenCard">Total</strong> Appointments  </span><br><span class="Numbera">${totalAppointments}</span></div>
    <div class="analyticsInfo"><span class="label"> Total of Paid<strong class="GreenCard"> Appointments</strong> </span><br><span class="Numbera">${totalAppointmentsPayed}</span></div>
    <div class="analyticsInfo"><span class="label"> Payment<strong class="GreenCard"> Rate</strong> </span><br><span class="Numbera">${Math.ceil(
      mediaDePrePagamentos,
    )}%</span></div>
    <div class="analyticsInfo"><span class="label">Total<strong class="GreenCard"> Subscribers</strong>  </span><br><span class="Numbera">${planNumber}</span></div>
    <div class="analyticsInfo"><span class="label">  <strong class="GreenCard"> Cancelled</strong> Appointments </span><br><span class="Numbera">${Math.ceil(
      mediaDeCancelamentos,
    )}%</span></div>
    <div class="analyticsInfo"><span class="label">Average total <strong class="GreenCard">expenditure</strong> </span><br><span class="pricer">R$ ${formatGastos}</span></div>
    
    </div>
    </div>
    `;
    return res.status(200).json({
      structure: structure,
      beta: "SOBROU ALGO PARA O BETA FINALMENTE!!!!!!!!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ BRUTAL: "SOBROU OQUE PRO BETA", erro: error });
  }
});
app.get("/client/schedules", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "clientDo.html"));
});
app.get("/today-schedules", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const findStoreDatas = await StoreCadschema.findOne({
      name: name,
      email: email,
    });
    if (!findStoreDatas) {
      console.log("Erro aqui em findStoreDatas");
      return res.status(404).json({
        OBeta: "N ENCONTROU NADA AQUI",
      });
    }
    const storeName = findStoreDatas.storeName;
    const today = new Date();
    const todayDate = today.getDate();
    const month = today.getMonth() + 1;
    const formatMonth = month.toString().padStart(2, "0");
    const query = `${todayDate}/${formatMonth}`;
    console.log(query);
    const findToday = await scheduleSchema
      .find({
        storeName: storeName,
        day: query,
      })
      .lean();
    if (!findToday) {
      console.log("Erro aqui em findToday");
      return res.status(404).json({
        OBeta: "N ENCONTROU NADA AQUI Tambem",
      });
    }
    const hrEmMin = today.getHours() * 60 + today.getMinutes();
    console.log(hrEmMin);
    const ordenadosAgendamentos = findToday
      .map((agendamento) => {
        const [hora, minutos] = agendamento.finishHour.split(":").map(Number);
        const horaAgendamentosMinutos = hora * 60 + minutos;
        const diferenca = horaAgendamentosMinutos - hrEmMin;

        return {
          ...agendamento,
          diferenca: diferenca,
        };
      })
      .filter((agendamento) => agendamento.diferenca >= 0)
      .sort((a, b) => a.diferenca - b.diferenca);
    console.log(findToday);
    let htmlArr = [];

    for (let i = 0; i < ordenadosAgendamentos.length; i++) {
      let day = ordenadosAgendamentos[i].day;
      let hour = ordenadosAgendamentos[i].hour;
      let functionary = ordenadosAgendamentos[i].functionary;
      let nameC = ordenadosAgendamentos[i].name;
      let emailC = ordenadosAgendamentos[i].email;
      let value = ordenadosAgendamentos[i].totalPrice / 100;
      let services = ordenadosAgendamentos[i].services;
      let finishHour = ordenadosAgendamentos[i].finishHour
      let cS = [];
      for (let j = 0; j < services.length; j++) {
        let serviceName = services[j];
        let html = `
        <p>${serviceName}
        `;
        cS.push(html);
      }
      const randomSymbol = ["$", "#", ">>"];
      let random = Math.floor(Math.random() * 3);
      if (ordenadosAgendamentos[i].payed) {
        let structure = `<div class="union">
          <div class="payed-symbol" title="Previously paid"> <img src="https://img.icons8.com/?size=100&id=122142&format=png&color=FFFFFF"></div>
              <div class="schedule-content schedule-payed">
                <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}" data-nameC="${nameC}" data-emailC="${emailC}">
          <div class="schedule-StoreName" ><strong class="consoleWrite">${
            randomSymbol[random]
          }</strong>${nameC}</div>
          <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
          <div class="schedule-Dam">
          <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
            <div class="schedule-services">${cS.join(",")}</p></div>
            <br>
            <strong class="jsonWrite">}</strong>
          </div>
          
          
          
                </div>
                <div class="lateralInfos">
          <div class="delete">
              <img
                src="https://img.icons8.com/?size=100&id=95771&format=png&color=FFFFFF"
              />
            </div>
            <div class="confirm">
              <img
                src="https://img.icons8.com/?size=100&id=83145&format=png&color=FFFFFF"
              />
            </div>
          <div class="schedule-dayEHour">
                <div class="schedule-Day">
                 <strong class="dayEHour">$ ${value
                   .toFixed(2)
                   .replace(".", ",")}</strong>
              </div>
                 <div class="schedule-Hour">
                 <strong class="dayEHour">${hour} - ${finishHour}</strong>
              </div>
              </div>
                </div>
              </div>
        </div>`;
        htmlArr.push(structure);
      } else {
        let structure = `<div class="schedule-content">
      <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}"  data-nameC="${nameC}" data-emailC="${emailC}">
        <div class="schedule-StoreName" ><strong class="consoleWrite">${
          randomSymbol[random]
        }</strong>${nameC}</div>

        <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
        <div class="schedule-Dam">
        <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
          <div class="schedule-services">${cS.join(",")}</p></div>
          <br>
          <strong class="jsonWrite">}</strong>
        </div>
          
        

        
      </div>
      <div class="lateralInfos">
       <div class="delete">
              <img
                src="https://img.icons8.com/?size=100&id=95771&format=png&color=FFFFFF"
              />
            </div>
            <div class="confirm">
              <img
                src="https://img.icons8.com/?size=100&id=83145&format=png&color=FFFFFF"
              />
            </div>
        <div class="schedule-dayEHour">
              <div class="schedule-Day">
                 <strong class="dayEHour">$ ${value
                   .toFixed(2)
                   .replace(".", ",")}</strong>
              </div>
              <div class="schedule-Hour">
                 <strong class="dayEHour">${hour} - ${finishHour}</strong>
              </div>
            </div>
      </div>
    </div>
      `;
        htmlArr.push(structure);
      }
    }
    let html = `<div class="schedule-union" id="opacitor1">${htmlArr.join(
      "",
    )}</div>'<div class="store-content" id="weekDiv"></div>'`;
    return res.status(200).json({
      returner: html,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});
app.get("/week-schedules", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const findStoreDatas = await StoreCadschema.findOne({
      name: name,
      email: email,
    });
    if (!findStoreDatas) {
      console.log("Erro in findStoreData do week-schedule");
    }
    const storeName = findStoreDatas.storeName;
    const findToday = await scheduleSchema
      .find({
        storeName: storeName,
      })
      .lean();
    if (!findToday) {
      console.log("Erro aqui em findToday");
      return res.status(404).json({
        OBeta: "N ENCONTROU NADA AQUI Tambem",
      });
    }
    const date = new Date();
    const weekSchedules = [];
    for (let i = 0; i < 8; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() + i);
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const query = `${day}/${month.toString().padStart(2, "0")}`;

      const filtrador = findToday.filter((schedule) => schedule.day === query);
      // console.log(hrEmMin)
      const ordenadosAgendamentos = filtrador
        .map((agendamento) => {
          const [hora, minutos] = agendamento.hour.split(":").map(Number);
          const horaAgendamentosMinutos = hora * 60 + minutos;
          const openHour = findStoreDatas.openHours;
          const [hh, mm] = openHour.split(":").map(Number);
          const horaDeAbrir = hh * 60 + mm;
          const diferenca = Math.abs(horaAgendamentosMinutos - horaDeAbrir);

          return {
            ...agendamento,
            diferenca: diferenca,
          };
        })
        .sort((a, b) => a.diferenca - b.diferenca);
      weekSchedules.push(ordenadosAgendamentos);
    }

    let htmlArr = [];
    for (let d = 0; d < weekSchedules.length; d++) {
      const daySchedule = weekSchedules[d];
      for (let s = 0; s < daySchedule.length; s++) {
        let day = daySchedule[s].day;
        let hour = daySchedule[s].hour;
        let functionary = daySchedule[s].functionary;
        let nameC = daySchedule[s].name;
        let emailC = daySchedule[s].email;
        let value = daySchedule[s].totalPrice / 100;
        let services = daySchedule[s].services;
        let price = daySchedule[s].totalPrice / 100;
        let totalPrice = price.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        let storeNamer = storeName.replaceAll("/", " ");
        let cS = [];
        for (let j = 0; j < services.length; j++) {
          let serviceName = services[j];
          let html = `
        <p>${serviceName}
        `;
          cS.push(html);
        }
        const randomSymbol = ["$", "#", ">>"];
        let random = Math.floor(Math.random() * 3);
        if (daySchedule[s].payed) {
          let structure = `<div class="union">
          
              <div class="schedule-content schedule-payed">
                <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}" data-nameC="${nameC}" data-emailC="${emailC}">
          <div class="schedule-StoreName" ><strong class="consoleWrite">${
            randomSymbol[random]
          }</strong>${nameC}</div>
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
               <img src="https://img.icons8.com/?size=100&id=122142&format=png&color=FFFFFF">
            </div>
          <div class="columnUnion">
            <strong class="pricery">R$ ${totalPrice}</strong>
            <div class="schedule-dayEHour">
                  <div class="schedule-Day">
                     <strong class="dayEHour">${day}</strong>
                  </div>
                  <div class="schedule-Hour">
                     <strong class="dayEHour" style="font-size:0.9em;">${hour} - ${
                       daySchedule[s].finishHour
                     }</strong>
                  </div>
                </div>
          </div>
                </div>
              </div>
        </div>`;
          htmlArr.push(structure);
        } else {
          let structure = `<div class="schedule-content">
      <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}"  data-nameC="${nameC}" data-emailC="${emailC}">
        <div class="schedule-StoreName" ><strong class="consoleWrite">${
          randomSymbol[random]
        }</strong>${nameC}</div>

        <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
        <div class="schedule-Dam">
        <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
          <div class="schedule-services">${cS.join(",")}</p></div>
          <br>
          <strong class="jsonWrite">}</strong>
        </div>
          
        

        
      </div>
      <div class="lateralInfos">
       <div class="delete" style="opacity:0;">
              <img
                src="https://img.icons8.com/?size=100&id=95771&format=png&color=FFFFFF"
              />
            </div>
            
       <div class="columnUnion">
            <strong class="pricery">R$ ${totalPrice}</strong>
            <div class="schedule-dayEHour">
                  <div class="schedule-Day">
                     <strong class="dayEHour">${day}</strong>
                  </div>
                  <div class="schedule-Hour">
                     <strong class="dayEHour" style="font-size:0.9em;">${hour} - ${
                       daySchedule[s].finishHour
                     }</strong>
                  </div>
                </div>
          </div>
      </div>
    </div>
      `;
          htmlArr.push(structure);
        }
      }
    }

    let html = `<div class="schedule-union" id="opacitor2">${htmlArr.join(
      '<div class="store-content" id="weekDiv"></div>',
    )}</div>`;
    return res.status(200).json({
      returner: html,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});
app.get("/month-schedules", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const findStoreDatas = await StoreCadschema.findOne({
      name: name,
      email: email,
    });
    if (!findStoreDatas) {
      console.log("Erro in findStoreData do week-schedule");
    }
    const storeName = findStoreDatas.storeName;
    const findToday = await scheduleSchema
      .find({
        storeName: storeName,
      })
      .lean();
    if (!findToday) {
      console.log("Erro aqui em findToday");
      return res.status(404).json({
        OBeta: "N ENCONTROU NADA AQUI Tambem",
      });
    }
    const date = new Date();
    const weekSchedules = [];
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(date);
      currentDate.setDate(date.getDate() + i);
      const day = currentDate.getDate();
      const month = currentDate.getMonth() + 1;
      const query = `${day}/${month.toString().padStart(2, "0")}`;

      const filtrador = findToday.filter((schedule) => schedule.day === query);
      // console.log(hrEmMin)
      const ordenadosAgendamentos = filtrador
        .map((agendamento) => {
          const [hora, minutos] = agendamento.hour.split(":").map(Number);
          const horaAgendamentosMinutos = hora * 60 + minutos;
          const openHour = findStoreDatas.openHours;
          const [hh, mm] = openHour.split(":").map(Number);
          const horaDeAbrir = hh * 60 + mm;
          const diferenca = Math.abs(horaAgendamentosMinutos - horaDeAbrir);

          return {
            ...agendamento,
            diferenca: diferenca,
          };
        })
        .sort((a, b) => a.diferenca - b.diferenca);
      weekSchedules.push(ordenadosAgendamentos);
    }

    let htmlArr = [];
    for (let d = 0; d < weekSchedules.length; d++) {
      const daySchedule = weekSchedules[d];
      for (let s = 0; s < daySchedule.length; s++) {
        let day = daySchedule[s].day;
        let hour = daySchedule[s].hour;
        let functionary = daySchedule[s].functionary;
        let nameC = daySchedule[s].name;
        let emailC = daySchedule[s].email;
        let value = daySchedule[s].totalPrice / 100;
        let services = daySchedule[s].services;
        let price = daySchedule[s].totalPrice / 100;
        let totalPrice = price.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        let storeNamer = storeName.replaceAll("/", " ");
        let cS = [];
        for (let j = 0; j < services.length; j++) {
          let serviceName = services[j];
          let html = `
        <p>${serviceName}
        `;
          cS.push(html);
        }
        const randomSymbol = ["$", "#", ">>"];
        let random = Math.floor(Math.random() * 3);
        if (daySchedule[s].payed) {
          let structure = `<div class="union">
          
              <div class="schedule-content schedule-payed">
                <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}" data-nameC="${nameC}" data-emailC="${emailC}">
          <div class="schedule-StoreName" ><strong class="consoleWrite">${
            randomSymbol[random]
          }</strong>${nameC}</div>
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
               <img src="https://img.icons8.com/?size=100&id=122142&format=png&color=FFFFFF">
            </div>
          <div class="columnUnion">
            <strong class="pricery">R$ ${totalPrice}</strong>
            <div class="schedule-dayEHour">
                  <div class="schedule-Day">
                     <strong class="dayEHour">${day}</strong>
                  </div>
                  <div class="schedule-Hour">
                     <strong class="dayEHour" style="font-size:0.9em;">${hour} - ${
                       daySchedule[s].finishHour
                     }</strong>
                  </div>
                </div>
          </div>
                </div>
              </div>
        </div>`;
          htmlArr.push(structure);
        } else {
          let structure = `<div class="schedule-content">
      <div class="schedule-data" data-dia="${day}" data-hour="${hour}" data-storeName="${storeName}" data-functionary="${functionary}"  data-nameC="${nameC}" data-emailC="${emailC}">
        <div class="schedule-StoreName" ><strong class="consoleWrite">${
          randomSymbol[random]
        }</strong>${nameC}</div>

        <div class="schedule-Fun"><strong class="GreenCard" style="margin-bottom: 10px;">Professional:</strong> ${functionary}</div>
        <div class="schedule-Dam">
        <strong class="GreenCard">Services:</strong><br><strong class="jsonWrite">{</strong><br>
          <div class="schedule-services">${cS.join(",")}</p></div>
          <br>
          <strong class="jsonWrite">}</strong>
        </div>
          
        

        
      </div>
      <div class="lateralInfos">
       <div class="delete" style="opacity:0;">
              <img
                src="https://img.icons8.com/?size=100&id=95771&format=png&color=FFFFFF"
              />
            </div>
            
       <div class="columnUnion">
            <strong class="pricery">R$ ${totalPrice}</strong>
            <div class="schedule-dayEHour">
                  <div class="schedule-Day">
                     <strong class="dayEHour">${day}</strong>
                  </div>
                  <div class="schedule-Hour">
                     <strong class="dayEHour" style="font-size:0.9em;">${hour} - ${
                       daySchedule[s].finishHour
                     }</strong>
                  </div>
                </div>
          </div>
      </div>
    </div>
      `;
          htmlArr.push(structure);
        }
      }
    }

    let html = `<div class="schedule-union" id="opacitor3">${htmlArr.join(
      '<div class="store-content" id="weekDiv"></div>',
    )}</div>`;
    return res.status(200).json({
      returner: html,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error });
  }
});
app.get("/stores/prefs", (req, res) => {
  return res.status(200).sendFile(path.join(__dirname, "public", "prefs.html"));
});
app.get("/create/plans", (req, res) => {
  return res.sendFile(path.join(__dirname, "public", "plansData.html"));
});
app.get("/prefs/render", tokenVerify, async (req, res) => {
  const { name, email } = req.user;

  try {
    const store = await StoreCadschema.findOne({
      name: name,
      email: email,
    });
    if (!store) {
      console.log("ERROR EM STORE");
      return res.status(404).json({ error: "N ENCONTRADO EM STORE" });
    }
    const services = await ServiceCadSchema.findOne({
      name: name,
      email: email,
      storeName: store.storeName,
    });
    if (!services) {
      console.log("ERROR EM SERVICES");
      return res.status(404).json({ error: "N ENCONTRADO EM SERVICES" });
    }
    const plans = await plansSchema.findOne({
      name: name,
      email: email,
      storeName: store.storeName,
    });
    let planArray = [];
    if (plans) {
      for (let i = 0; i < plans.planName.length; i++) {
        const storePlan = plans.storeName;
        const plan = plans.planName;

        const price = plans.planPrice[i] / 100;
        const trueFormat = price.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const planName = plan[i].split(":");
        const planNamer = planName[1];
        let html = `<div class="columnUnion">
        <div class="myPlan temPlan" style="margin: 3vh;"><div class="plan-name">${planNamer}<div class="store-name-plan"><strong class="consoleWrite">#</strong>${storePlan.replaceAll(
          "/",
          " ",
        )}</div><br></div><div class="plan-price"><strong class="consoleWrite">$</strong>${trueFormat}</div></div>
        <div class="ocultEditor"><img src="https://img.icons8.com/?size=100&id=89802&format=png&color=FFFFFF" alt="" style="width:24px; height:24px;"></div>
      </div>
      `;
        planArray.push(html);
      }

      console.log(planArray);
    } else {
      let html = `<div class="columnUnion">
        <div class="myPlan" style="margin: 3vh;"><div class="plan-name">Don't have Plans<div class="store-name-plan"><strong class="consoleWrite">#</strong>You</div><br></div><div class="plan-price"><strong class="consoleWrite">$</strong>00,00</div></div>
        <div class="ocultEditor"><img src="https://img.icons8.com/?size=100&id=89802&format=png&color=FFFFFF" alt="" style="width:24px; height:24px;"></div>
      </div>
      `;
      planArray.push(html);
    }
    const hour = await HoursStorage.findOne({
      storeName: store.storeName,
      storeEmail: store.storeEmail,
    });
    if (!hour) {
      console.log("ERROR EM HOUR");
      return res.status(404).json({ error: "N ENCONTRADO EM HOUR" });
    }
    //Fazer depois o sistema do product, nescerariamente dia 09/01/2026
    const functionar = await functionaryCad.findOne({
      name: name,
      email: email,
      storeName: store.storeName,
    });
    if (!functionar) {
      console.log("ERROR EM FUNCTIONARY");
      return res.status(404).json({ error: "N ENCONTRADO EM FUNCTIONARY" });
    }
    const bankDatas = await BankSchema.findOne({
      name: name,
      email: email,
    });
    if (!bankDatas) {
      console.log("ERROR EM BANK DATAS");
      return res.status(404).json({ error: "N ENCONTRADO EM BANK DATAS" });
    }
    let servicesArray = [];
    const ServicesimagePath = services.serviceImagePath;
    for (let i = 0; i < services.serviceName.length; i++) {
      const baseStructureOfServices = `<br><div class="prefservices"><img src="${ServicesimagePath[i]}" class="prefservicesImg"><div class="prefServicesText"><p>${services.serviceName[i]}</p></div></div>
      `;
      servicesArray.push(baseStructureOfServices);
    }
    console.log(servicesArray);
    let functionarysArray = [];
    const nameOfFunctionarys = functionar.functionarysName;
    const imagePath = functionar.functionaryImagePath;
    for (let i = 0; i < nameOfFunctionarys.length; i++) {
      const moreBase = `<br><div class="functionaryBaseDiv max55"  name-of="${nameOfFunctionarys[i]}"><div class="uniondivers">
      <div class="imageFunctionary"><img src="${imagePath[i]}"></div><div class="nameOfFunctionary">
        <p>${nameOfFunctionarys[i]}</p>
      </div>
    </div><div class="functionaryMore" style="opacity:0;">
    <button>
        <img src="https://img.icons8.com/?size=100&id=89802&format=png&color=FFFFFF" alt="" style="width:24px; height:24px;">
    </button>
          </div></div>`;
      functionarysArray.push(moreBase);
    }
    let hoursArray = [];
    const hoursTobeDiv = hour.hour;
    for (let i = 0; i < hoursTobeDiv.length; i++) {
      const outlierBase = `<br><div class="hhmm" data-hour="${hoursTobeDiv[i]}">${hoursTobeDiv[i]}</div>`;
      hoursArray.push(outlierBase);
    }
    let st = ``;
    const storeB = await store_data_schema.findOne({
      name: name,
      email: email,
      storeName: store.storeName,
    });
    if (!storeB) {
      console.error(storeB);
      return res.status(404).json({
        error: "storeB",
      });
    }
    if (storeB.prePayment) {
      st = `<img src="https://img.icons8.com/?size=100&id=122178&format=png&color=FFFFFF" id="prePayOn"><img src="https://img.icons8.com/?size=100&id=90219&format=png&color=FFFFFF" id="prePayOff"></img>`;
    } else {
      st = `<img src="https://img.icons8.com/?size=100&id=90219&format=png&color=FFFFFF" id="prePayOn"></img><img src="https://img.icons8.com/?size=100&id=122178&format=png&color=FFFFFF" id="prePayOff">`;
    }
    let ri = ``;

    if (bankDatas.holder_type === "company") {
      ri = `<option value="company"> Company</option>
      <option value="individual">Individual</option>`;
    } else {
      ri = `<option value="individual">Individual</option>
                          <option value="company"> Company</option>`;
    }
    let render = `<div class="unionE">
      <div class="Identifire">
        <h1>Prefer<strong class="GreenCard">ences</strong></h1>
        <p>
          <strong class="consoleWrite">>_</strong>Manage services, hours, and
          store configurations, Click in one field for edit<strong class="pointer">. </strong>
        </p>
      </div>
      <div class="columnUnion">
        <span class="label" style="font-size: 0.8em; margin: 0 0 2vh 0"
          >Some of their <strong class="GreenCard">schedules</strong
          ><strong class="pointer">.</strong></span
        >
        <div class="miniCalendar">${hoursArray.slice(0, 6).join("")}</div>
        <div class="ocultEditor">
          <img
            src="https://img.icons8.com/?size=100&id=89802&format=png&color=FFFFFF"
            class="prefservicesEdit"
          />
        </div>
      <div class="prePayment" data-type="${storeB.prePayment}">${st}</div>
      </div>
    </div>

    <div class="unionE">
      
        <div class="servicesTapete">
          ${servicesArray.slice(0, 11).join("")}
          <div class="prefservicesEditer">
            <img
              src="https://img.icons8.com/?size=100&id=89802&format=png&color=FFFFFF"
              class="prefservicesEdit"
            />
            <div class="prefServicesText"><p>Edit</p></div>
          </div>
        </div>
      
    </div>
    <div class="unionE">
      <div class="centralize">
        <div class="Empire">
          <span class="label"
            >Some of your <strong class="GreenCard">plans</strong
            ><strong class="pointer">.</strong></span>
          <div class="unionE">${planArray.slice(0, 3).join("")}</div>
        </div>
      </div>
    </div>
    <div class="columnUnion">
    ><span class="label"
          >Some of the members of your  <strong class="GreenCard">Team</strong
          ><strong class="pointer">.</strong></span>
    <div class="functionaryBreaker"${functionarysArray
      .slice(0, 7)
      .join("")}</div></div>
    <div class="columnUnion">
    <span class="label"
          >Your bank   <strong class="GreenCard">Datas</strong
          ><strong class="pointer">.</strong></span>
      <form action="/update/bank" method="post"  style=" margin-top: 5vh;">
                  <div class="FormSeparate">
                      <input
                        type="text"
                        name="holder_name"
                        id="holder_name"
                        placeholder="Holder Name: "
                        value="${bankDatas.holder_name}"
                      />
      
                      <input
                        type="text"
                        name="account_number"
                        id="account_number"
                        placeholder="Account Number"
                        value="${descriptografar(bankDatas.account_number)}"
                      />
                      <select name="holder_type" id="holder_type">
                          ${ri}
                      </select>
                  </div>
                  <div class="cvvForm">
                      <input
                        type="text"
                        name="bank_code"
                        id="bank_code"
                        placeholder="Bank Code"
                        maxlength="3"
                        value="${bankDatas.bank_code}"
                      />
                      <input
                        type="text"
                        name="branch_code"
                        id="branch_code"
                        placeholder="Agency Number"
                        maxlength="4"
                        value="${bankDatas.branch_code}"
                      />
      
                  </div>
                  <input type="submit" value="Update" id="bankUpdater">
                </form>
          </div>
            </div>
    </div>
    <div class=" ofr-div">
                <div class="txt">
                    <h1><strong class="consoleWrite">>></strong>Edit your store <strong class="GreenCard">datas</strong> </h1>
                    <p>To update your <strong class="jsonWrite">store information</strong>, click in one field, and make your changes.<strong class="pointer">.</strong></p>
                    <button class="requestBtn">
                        Update Datas
                    </button>
                </div>
                
            </div>`;
    return res.status(200).json({ returner: render });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error });
  }
});
app.get("/select/updater-wizard/:type", tokenVerify, async (req, res) => {
  const type = req.params.type;
  if (type == "hour") {
    return res
      .status(200)
      .sendFile(path.join(__dirname, "public", "hour-att.html"));
  }
  if (type == "plan") {
    return res
      .status(200)
      .sendFile(path.join(__dirname, "public", "plan-att.html"));
  }
  if (type == "services") {
    return res
      .status(200)
      .sendFile(path.join(__dirname, "public", "services-att.html"));
  }
  if (type == "team") {
    return res
      .status(200)
      .sendFile(path.join(__dirname, "public", "team-att.html"));
  }
  if (type == "all") {
    return res
      .status(200)
      .sendFile(path.join(__dirname, "public", "storeData-att.html"));
  } else {
    return res.status(500).json({
      erorr: "error",
    });
  }
});
app.get("/updater/hour", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const findStore = await StoreCad.findOne({
      name: name,
      email: email,
    });
    if (!findStore) {
      console.log("FIND STORE");
      return res.status(404).json({
        error: "FIND STORE",
      });
    }
    const returnHour = await HourSchema.findOne({
      storeName: findStore.storeName,
      storeEmail: findStore.storeEmail,
    });
    if (!returnHour) {
      console.log("FINDHOUR");
      return res.status(404).json({
        error: "FINDHOUR",
      });
    }
    const today = new Date();
    const todayDate = today.getDate();
    const month = today.getMonth() + 1;
    const formatMonth = month.toString().padStart(2, "0");
    const query = `${todayDate}/${formatMonth}`;
    console.log(query);
    const hrEmMin = today.getHours() * 60 + today.getMinutes();
    console.log(hrEmMin);
    let hoursArray = [];
    for (let i = 0; i < returnHour.hour.length; i++) {
      const outlierBase = `<div class="hour-row"><input type="text" name="hour" id="hour" placeholder="HH:MM" value="${returnHour.hour[i]}"></div>`;
      hoursArray.push(outlierBase);
    }
    return res.status(200).json({
      html: hoursArray.join(""),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.post("/hour/updater", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { hour } = req.body;
  try {
    const store = await StoreCad.findOne({ name: name, email: email }).lean();
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
      return res.status(400).redirect("/select/updater-wizard/hour");
    }
    const uniqueHours = [...new Set(normalized)];

    const updaterLancher = await HoursStorage.findOneAndUpdate(
      {
        storeName: store.storeName,
        storeEmail: store.storeEmail,
        phone: store.phone,
      },
      {
        hour: uniqueHours,
      },
    );
    if (!updaterLancher) {
      return res.status(400).json({ message: "ERRO AO LANÇAR", invalid });
    }
    return res.redirect("/stores/prefs");
  } catch (error) {
    return res.status(500).json({ message: "ERRO NO SERVER", eror: error });
  }
});
app.get("/updater/plans", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const plans = await plansSchema.findOne({
      name: name,
      email: email,
    });
    if (!plans) {
      console.log("FINDPLAN");
      return res.status(404).json({
        error: "FINDPLAN",
      });
    }
    let planArray = [];
    for (let i = 0; i < plans.planName.length; i++) {
      const storePlan = plans.storeName;
      const plan = plans.planName;

      const price = plans.planPrice[i];
      const planName = plan[i].split(":");
      const planNamer = planName[1];
      const planDes = plans.planDescription[i];
      const realP = (price / 100).toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
      let html = `<div id="contentForm" class="hour-row">
                <div class="unionE">
                  <input
                    type="text"
                    name="name_product"
                    id="name_product"
                    placeholder="Plan Name"
                    value="${planNamer}"
                  />
                  <input
                    type="text"
                    name="price_product"
                    id="price_product"
                    placeholder="Plan Product"
                    value="${realP}"
                  />
                </div>
                <textarea
                  name="description"
                  id="description"
                  placeholder="Description"
                  style="margin-left: 0;"
                  
                >${planDes}</textarea>
              
              </div></div>
      `;
      planArray.push(html);
    }
    console.log(planArray.join(""));
    return res.status(200).json({
      html: `<div class="unionE">${planArray.join("")}</div>`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.post("/plan/updater", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { name_product, price_product, description } = req.body;

  console.log("📦 Dados recebidos:");
  console.log("name_product:", name_product);
  console.log("price_product:", price_product);
  console.log("description:", description);

  try {
    const findYourStore = await StoreCad.findOne({
      name: name,
      email: email,
    });

    if (!findYourStore) {
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    let storeName = findYourStore.storeName.replaceAll("/", " ");
    let productInStripeNameArray = [];
    const stripeId = [];
    const planCode = findYourStore.model;

    // ============================================
    // PROCESSAR ARRAY DE PLANS
    // ============================================
    if (Array.isArray(name_product)) {
      for (let i = 0; i < name_product.length; i++) {
        const productInStripeName = `${storeName}:${name_product[i]}:${findYourStore.model}`;

        // ✅ CORREÇÃO: Converter vírgula para ponto e validar
        const priceStr = String(price_product[i]).replace(",", ".");
        const priceValue = parseFloat(priceStr);

        if (isNaN(priceValue) || priceValue <= 0) {
          console.error(`❌ Preço inválido no índice ${i}:`, price_product[i]);
          return res.status(400).json({
            error: `Preço inválido para "${name_product[i]}": ${price_product[i]}`,
          });
        }

        const unitAmount = Math.round(priceValue * 100);
        console.log(
          `💰 Plan ${i}: ${name_product[i]} = R$ ${priceValue} (${unitAmount} centavos)`,
        );

        const stripeProduct = await stripe.products.create({
          name: productInStripeName,
          metadata: {
            storeOwner: name,
            ownerEmail: email,
          },
        });

        const stripeProductPrice = await stripe.prices.create({
          product: stripeProduct.id,
          unit_amount: unitAmount,
          currency: "brl",
          recurring: {
            interval: "month",
          },
        });

        stripeId.push(stripeProduct.id);
        productInStripeNameArray.push(productInStripeName);
      }
    }
    // ============================================
    // PROCESSAR PLAN ÚNICO
    // ============================================
    else {
      const productInStripeName = `${storeName}:${name_product}:${findYourStore.model}`;

      // ✅ CORREÇÃO: Converter vírgula para ponto e validar
      const priceStr = String(price_product).replace(",", ".");
      const priceValue = parseFloat(priceStr);

      if (isNaN(priceValue) || priceValue <= 0) {
        console.error("❌ Preço inválido:", price_product);
        return res.status(400).json({
          error: `Preço inválido: ${price_product}`,
        });
      }

      const unitAmount = Math.round(priceValue * 100);
      console.log(
        `💰 Plan único: ${name_product} = R$ ${priceValue} (${unitAmount} centavos)`,
      );

      const stripeProduct = await stripe.products.create({
        name: productInStripeName,
        metadata: {
          storeOwner: name,
          ownerEmail: email,
        },
      });

      const stripeProductPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: unitAmount,
        currency: "brl",
        recurring: {
          interval: "month",
        },
      });

      stripeId.push(stripeProduct.id);
      productInStripeNameArray.push(productInStripeName);
    }

    // ✅ CORREÇÃO: Converter preços para centavos
    const pricesInCents = Array.isArray(price_product)
      ? price_product.map((p) => {
          const val = parseFloat(String(p).replace(",", "."));
          return Math.round(val * 100);
        })
      : [Math.round(parseFloat(String(price_product).replace(",", ".")) * 100)];

    console.log("💾 Salvando no DB:", pricesInCents);

    // ============================================
    // ATUALIZAR NO BANCO
    // ============================================
    const updater = await plansSchema.findOneAndUpdate(
      {
        name: name,
        email: email,
      },
      {
        $set: {
          planName: productInStripeNameArray,
          planOriginalName: Array.isArray(name_product)
            ? name_product
            : [name_product],
          planPrice: pricesInCents,
          planDescription: Array.isArray(description)
            ? description
            : [description],
          planStripeCode: stripeId,
        },
      },
      { new: true },
    );

    if (!updater) {
      return res.status(400).json({ error: "Nenhum cadastro encontrado" });
    }

    console.log("✅ Plans atualizados com sucesso!");
    return res.status(200).redirect("/stores/prefs");
  } catch (error) {
    console.error("❌ Erro no updater:", error);
    return res.status(500).json({
      error: "Erro no servidor",
      msg: error.message,
    });
  }
});
app.get("/updater/services", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const services = await ServicesCad.findOne({
      name: name,
      email: email,
    });
    if (!services) {
      console.log("IN SERVICES");
      return res.status(404).json({
        error: "IN SERVICES",
      });
    }
    let htmlArr = [];
    for (let i = 0; i < services.serviceName.length; i++) {
      let stcr = `<div class="ServiceDiv" data-img="${services.serviceImagePath[i]}">
        <div class="ServiceInput">
              <div class="imageServiceInput">
                <img
                  src="${services.serviceImagePath[i]}"
                  alt=""
                />
                <input type="file" name="image" id="image" value="${services.serviceImagePath[i]}" />
              </div>
              <div class="servicesInfos">
                <input
                  type="text"
                  name="serviceName"
                  id="serviceName"
                  placeholder="Service Name:"
                  value="${services.serviceName[i]}"
                />
                <textarea
                  name="serviceDesc"
                  id="serviceDesc"
                  placeholder="Write a description for your service with a maximum of 100 characters."
                  maxlength="100"
                >${services.serviceDesc[i]}</textarea>
                <span class="Caracters">
                  Caracters:
                  <strong class="GreenCard">0</strong>
                  /
                  <strong class="GreenCard">100</strong>
                </span>
        <select name="servicesTime" id="servicesTime">
          <option value="${services.servicesTime[i]}">${services.servicesTime[i]}</option>
          <option value="00:10">10min</option>
          <option value="00:15">15min</option>
                    <option value="00:30">30min</option>
                    <option value="00:45">45min</option>
                    <option value="01:00">1h</option>
                    <option value="01:30">1:30h</option>
                    <option value="02:00">2h</option>
                    <option value="02:30">2:30h</option>
                    <option value="03:00">3h</option>
                    <option value="03:30">3:30h</option>
                    <option value="04:00">4h</option>
                    <option value="04:30">4:30h</option>
                    <option value="05:00">5h</option>
                  </select>
                <h2 style="display: flex; align-items: center;">
                  <img src="https://img.icons8.com/?size=100&id=123084&format=png&color=FFFFFF" alt="" style="width:32px;margin-top:12px;">
                  <input type="text" name="servicePrice" id="servicePrice" value="${services.servicePrice[i]}" />
                </h2>
              </div>
            </div>
      </div>`;
      htmlArr.push(stcr);
    }
    return res.status(200).json({
      html: htmlArr.join(""),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.post("/services/updater", tokenVerify, upload.any(), async (req, res) => {
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
      })),
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
      req.body["serviceName[]"] ?? req.body.serviceName,
    );
    const serviceDescs = toArray(
      req.body["serviceDesc[]"] ?? req.body.serviceDesc,
    );
    const servicePricesRaw = toArray(
      req.body["servicePrice[]"] ?? req.body.servicePrice,
    );
    const servicesTime = toArray(
      req.body["servicesTime[]"] ?? req.body.servicesTime,
    );
    const files = req.files || [];

    const total =
      Math.max(
        serviceNames.length,
        serviceDescs.length,
        servicePricesRaw.length,
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
          "service",
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

    const newService = await ServicesCad.findOneAndUpdate(
      {
        name: name,
        email: email,
      },
      {
        storeName: findStore.storeName,
        storeEmail: findStore.storeEmail,
        phone: findStore.phone,
        serviceName: serviceNames,
        serviceDesc: serviceDescs,
        servicePrice: servicePricesRaw,
        servicesTime: servicesTime,
        serviceImagePath: imagePaths ?? null,
        serviceImageMeta: imageMeta ?? null,
      },
    );
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
      `Criados ${created.length} serviço(s). files.length=${files.length}`,
    );
    return res.redirect("/stores/prefs");
  } catch (error) {
    console.error("Erro ao cadastrar serviços:", error);
    return res.status(500).json({
      message: "Erro ao processar o cadastro de serviços.",
      error: error.message,
    });
  }
});
app.get("/updater/team", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const fnct = await functionaryCad.findOne({
      name: name,
      email: email,
    });
    if (!fnct) {
      console.log("FNCT");
      return res.status(404).json({
        EROR: "FNCT",
      });
    }
    let htmlArr = [];
    for (let i = 0; i < fnct.functionarysName.length; i++) {
      let stcr = `<div class="ServiceDiv" data-img="${fnct.functionaryImagePath[i]}">
        <div class="functionary-base">
                      <div class="imager coolImager"; ">
                          <span>Drag <strong class="GreenCard">or</strong> Select</span>
                          <img src="${fnct.functionaryImagePath[i]}" alt="">
                          <input type="file" name="image[]" id="image" style="opacity: 0;" value="${fnct.functionaryImagePath[i]}" />
                      </div>
                      <div class="inputer">
                          <input type="text" name="functionaryName[]" id="functionaryName" placeholder="Member Name:" value="${fnct.functionarysName[i]}">
                          <input type="email" name="functionaryEmail[]" id="functionaryEmail" placeholder="Member Email:" value="${fnct.functionarysEmail[i]}" >
                      </div>
                  </div>
      </div>`;
      htmlArr.push(stcr);
    }
    return res.status(200).json({
      html: htmlArr.join(" "),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      EROR: error,
    });
  }
});
app.post("/team/updater", tokenVerify, upload.any(), async (req, res) => {
  const { name, email } = req.user;

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
      })),
    );

    const findStore = await StoreCad.findOne({ name: name, email: email });
    if (!findStore) {
      console.log(name, email);
      return res.status(400).json({
        message: "Loja não encontrada",
        name: name,
        email: email,
      });
    }

    const toArray = (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : []);

    const functionaryName = toArray(
      req.body["functionaryName[]"] ?? req.body.functionaryName,
    );
    const functionaryEmail = toArray(
      req.body["functionaryEmail[]"] ?? req.body.functionaryEmail,
    );

    const files = req.files || [];

    const total =
      Math.max(functionaryName.length, functionaryEmail.length) || 0;

    if (total === 0 && !functionaryName.length && !functionaryEmail.length) {
      return res.status(400).json({ message: "Nenhum funcionário enviado" });
    }

    const imagePaths = [];
    const imageMeta = [];

    // ✅ Loop simples igual ao servicesCad
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        const processed = await processImageToWebp(file.buffer, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 80,
        });

        const saved = await saveBufferToDisk(
          processed.buffer,
          processed.format,
          "functionary",
        );

        const imageInfo = {
          storage: "disk",
          path: saved.relPath,
          filename: saved.fileName,
          format: processed.format,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
        };

        imagePaths.push(saved.relPath);
        imageMeta.push(imageInfo);
      } catch (imgErr) {
        console.warn("Falha ao processar imagem:", imgErr.message);
        // Adiciona null para manter índice
        imagePaths.push(null);
        imageMeta.push(null);
      }
    }

    console.log("imagePaths final:", imagePaths);
    console.log("imageMeta final:", imageMeta);

    const newFunctionary = await functionaryCad.findOneAndUpdate(
      {
        name: name,
        email: email,
      },
      {
        storeName: findStore.storeName,
        storeEmail: findStore.storeEmail,
        phone: findStore.phone,
        functionarysName: functionaryName,
        functionarysEmail: functionaryEmail,
        functionaryImagePath: imagePaths,
        functionaryImageMeta: imageMeta,
      },
    );
    if (newFunctionary) {
      console.log(`Criados funcionários. files.length=${files.length}`);

      // ✅ Redireciona igual ao servicesCad
      return res.redirect("/stores/prefs");
    }
  } catch (error) {
    console.error("Erro ao cadastrar funcionários:", error);
    return res.status(500).json({
      message: "Erro ao processar o cadastro.",
      error: error.message,
    });
  }
});
function generateHours(type, selectedHour) {
  let html = "";
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, "0") + ":00";
    const isSelected = hour === selectedHour ? "hourSelect" : "";
    html += `<div class="ourhours ${type} ${isSelected}" data-hour="${hour}">${hour}</div><br>`;
  }
  return html;
}
app.get("/updater/storeDatas", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const findStoreDatas = await StoreCad.findOne({
      name: name,
      email: email,
    });
    if (!findStoreDatas) {
      console.log("  NENHUMA LOJA ENCONTRADA");
      return res.status(404).json({
        error: "  NENHUMA LOJA ENCONTRADA",
      });
    }
    const storeName = findStoreDatas.storeName;
    const adress = findStoreDatas.address;
    const cnpj = findStoreDatas.cnpj;
    const storeEmail = findStoreDatas.storeEmail;
    const phone = findStoreDatas.phone;
    const pin = findStoreDatas.model;
    const description = findStoreDatas.description;
    const closedDays = findStoreDatas.closedDays
      ? findStoreDatas.closedDays.split(",")
      : [];

    // ✅ DECLARA a função para verificar se dia está fechado
    const isDayClosed = (day) => (closedDays.includes(day) ? "daySel" : "");
    let stcr = `<form id="storeForm" enctype="multipart/form-data" method="post" action="/rebirth/store-datas">
        <div class="formularyOrder">
          <div>
            <h1 id="ob"><strong class="consoleWrite">//</strong>Update your <strong class="GreenCard">store datas</strong></h1>
                  <p>Update your store datas here</p>
          </div>
        </div>
        <div class="formularyOrder">
          <div class="query">
            <div class="break">
              <input
                type="text"
                name="storeName"
                id="storeName"
                placeholder="Store name:"
                required
                class="normal"
                value="${storeName.replaceAll("/", " ")}"
              />
              <input
                type="text"
                name="address"
                id="address"
                placeholder="Full address"
                required
                class="normal"
                value="${adress}"
              />
              <input
                type="text"
                name="cnpj"
                id="cnpj"
                placeholder="CNPJ "
                required
                class="normal"
                value="${cnpj}"
              />
              
              
            </div>

            <div class="break">
              <input
                type="email"
                name="storeEmail"
                id="storeEmail"
                placeholder="Store email"
                required
                class="normal"
                value="${storeEmail}"
              />
              <input
                type="text"
                name="phone"
                id="phone"
                placeholder="Phone number"
                required
                class="normal"
                value="${phone}"
              />
              <div class="pinDiv"><input type="text" name="pin" id="pin" placeholder="PIN:" class="normal" value="${pin}"> </div>
              <input
                type="text"
                name="closedDays"
                id="closedDays"
                placeholder="Closed days"
                class="ghost"
                value="${findStoreDatas.closedDays}"
              />
              
                <input
                  type="text"
                  name="openHours"
                  id="openHours"
                  placeholder="Opening time(HH:MM)"
                  class="op-cl"
                  value="${findStoreDatas.openHours}"
                />
                <input
                  type="text"
                  name="closedHours"
                  id="closedHours"
                  placeholder="Closing time(HH:MM)"
                  class="op-cl"
                  value="${findStoreDatas.closedHours}"
                />

              
            </div>
          </div>
          <div class="txtAreaDiv">
            <textarea
              name="description"
              id="description"
              placeholder="Brief description of your store and services offered...(300 max)"
              
              maxlength="300"
            >${description}</textarea>
            <span class="Caracters">Caracters: <strong class="GreenCard">${
              description.length
            }</strong><strong class="consoleWrite">/</strong><strong class="GreenCard">300</strong></span>
          </div>
        </div>
        <div class="mid">
          <div class="imager">
            <span>Drag <strong class="GreenCard">or</strong> Select</span>
            <img src="${findStoreDatas.storeImagePath}" alt="">
            <input
              type="file"
              name="storeImage"
              id="storeImage"
              accept="image/*"
            />
          </div>
          <div class="selectDay">
            <h1 class="label"><strong class="consoleWrite">//</strong>Closed Days</h1>
             <div class="daysForSelect">
              <div class="dayOfWeek ${isDayClosed(
                "Sunday",
              )}" id="sunday" data-day="Sunday">Sunday <input type="checkbox" name="" id=""></div>
              <div class="dayOfWeek ${isDayClosed(
                "Monday",
              )}" data-day="Monday">Monday <input type="checkbox" name="" id=""></div>
              <div class="dayOfWeek ${isDayClosed(
                "Tuesday",
              )}" data-day="Tuesday">Tuesday <input type="checkbox" name="" id=""></div>
              <div class="dayOfWeek ${isDayClosed(
                "Wednesday",
              )}" data-day="Wednesday">Wednesday <input type="checkbox" name="" id=""></div>
              <div class="dayOfWeek ${isDayClosed(
                "Thursday",
              )}" data-day="Thursday">Thursday <input type="checkbox" name="" id=""></div>
              <div class="dayOfWeek ${isDayClosed(
                "Friday",
              )}" data-day="Friday">Friday <input type="checkbox" name="" id=""></div>
              <div class="dayOfWeek ${isDayClosed(
                "Saturday",
              )}" data-day="Saturday">Saturday <input type="checkbox" name="" id=""></div>
            </div>
          </div>
          

  <div class="openingAt">
    <h1 class="label" style="margin-left: 7vw;">
Opens <strong class="GreenCard">At</strong><strong class="pointer">.</strong></h1>
    <div class="openHours" id="opening">
      ${generateHours("open", findStoreDatas.openHours)}
    </div>
  </div>
  <div class="openingAt">
    <h1 class="label" style="margin-left: 7vw;">
Closes <strong class="GreenCard">At</strong><strong class="pointer">.</strong></h1>
    <div class="openHours" id="closed">
      ${generateHours("open", findStoreDatas.closedHours)}
    </div>
  </div><div class="selectedIndicatorC" style="margin-top:2vh;">
    
            <button type="submit">Register Store<strong class="consoleWrite">>></strong></button>
  </div>
        </div>
      </form>`;
    return res.status(200).json({
      html: stcr,
    });
  } catch (error) {}
});
app.post(
  "/rebirth/store-datas",
  tokenVerify,
  upload.any(),
  async (req, res) => {
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
        })),
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
        pin,
      } = req.body;
      // Validação básica
      if (!storeName || !address || !cnpj || !phone || !storeEmail) {
        return res.status(400).json({
          error: "Campos obrigatórios faltando",
        });
      }
      const storeNamer = storeName.replaceAll(" ", "/");
      // Verificar duplicação
      const existingStore = await StoreCad.findOne({
        name: name,
        email: email,
      });
      if (!existingStore) {
        return res.status(400).json({
          error: "Não existe uma loja no seu nome",
        });
      }

      // ✅ Processar imagem da loja
      let imageInfo = null;
      const storeImageFile = (req.files || []).find(
        (f) => f.fieldname === "storeImage",
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
            "store",
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
      if (imageInfo !== null) {
        const newStore = await StoreCad.findOneAndUpdate(
          {
            name: name,
            email: email,
          },
          {
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
          },
        );
        if (!newStore) {
          return res.status(400).json({
            tudoErrado: ":>",
            // finderData: finder,
            // outherData: outherFinder,
            returner: "ERRORRORORORROROROROR",
          });
        }
        console.log("✅ Loja cadastrada:", newStore._id);
      } else {
        const newStore = await StoreCad.findOneAndUpdate(
          {
            name: name,
            email: email,
          },
          {
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
          },
        );
        if (!newStore) {
          return res.status(400).json({
            tudoErrado: ":>",
            // finderData: finder,
            // outherData: outherFinder,
            returner: "ERRORRORORORROROROROR",
          });
        }
        console.log("✅ Loja cadastrada:", newStore._id);
      }
      const data = new Date();
      const legalFormat = data.toLocaleString("pt-br");
      const createBasicInfos = await store_data_schema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          storeName: storeNamer,
        },
      );
      if (!createBasicInfos) {
        return res.status(400).json({
          tudoErrado: ":>",
          // finderData: finder,
          // outherData: outherFinder,
          returner: "ERRORRORORORROROROROR",
        });
      }

      console.log("📁 Imagem salva em:", imageInfo?.path || "sem imagem");
      const services = await ServiceCadSchema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          storeName: storeNamer,
        },
      );
      if (!services) {
        return res.status(400).json({
          tudoErrado: ":>",
          // finderData: finder,
          // outherData: outherFinder,
          returner: "ERRORRORORORROROROROR",
        });
      }
      const functionary = await functionaryCad.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          storeName: storeNamer,
        },
      );
      if (!functionary) {
        return res.status(400).json({
          tudoErrado: ":>",
          // finderData: finder,
          // outherData: outherFinder,
          returner: "ERRORRORORORROROROROR",
        });
      }
      const hour = await HoursStorage.findOneAndUpdate(
        {
          storeName: existingStore.storeName,
        },
        {
          storeName: storeNamer,
        },
      );
      if (!hour) {
        return res.status(400).json({
          tudoErrado: ":>",
          // finderData: finder,
          // outherData: outherFinder,
          returner: "ERRORRORORORROROROROR",
        });
      }
      const findPlan = await plansSchema.findOne({
        name: name,
        email: email,
      });
      if (findPlan) {
        const plan = await plansSchema.findOneAndUpdate(
          {
            name: name,
            email: email,
          },
          {
            storeName: storeNamer,
          },
        );
        if (!plan) {
          return res.status(400).json({
            tudoErrado: ":>",
            // finderData: finder,
            // outherData: outherFinder,
            returner: "ERRORRORORORROROROROR",
          });
        }
      } // ✅ Atualiza TODOS os agendamentos em uma operação
      const result = await scheduleSchema.updateMany(
        { storeName: existingStore.storeName },
        { $set: { storeName: storeNamer } },
      );
      if (!result) {
        return res.status(400).json({
          tudoErrado: ":>",
          // finderData: finder,
          // outherData: outherFinder,
          returner: "ERRORRORORORROROROROR",
        });
      }
      const clientD = await recurring.updateMany(
        { storeName: existingStore.storeName },
        { $set: { storeName: storeNamer } },
      );
      if (!clientD) {
        return res.status(400).json({
          tudoErrado: ":>",
          // finderData: finder,
          // outherData: outherFinder,
          returner: "ERRORRORORORROROROROR",
        });
      }
      return res.redirect("/stores/prefs");
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
  },
);
app.get("/store-bank", (req, res) => {
  return res
    .status(200)
    .sendFile(path.join(__dirname, "public", "storeBank.html"));
});
app.get("/exist-bank-datas", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  try {
    const verifyBank = await BankSchema.findOne({
      name: name,
      email: email,
    });
    if (!verifyBank) {
      return res.status(500).json({
        error: "VerifyBank",
      });
    }
    const verifyAccount = await stripe.accounts.retrieve(verifyBank.stripe_id);
    if (verifyAccount.payouts_enabled == false) {
      const bankDel = await BankSchema.findOneAndDelete({
        name: name,
        email: email,
        stripe_id: verifyBank.stripe_id,
      });
      if (!bankDel) {
        console.error("NO  DELETER");
        return res.status(400).json({
          redirect: "/bank/datas",
        });
      }
    }
    const findActive = await BankSchema.findOne({
      name: name,
      email: email,
      stripe_id: verifyBank.stripe_id,
      active: true,
    });
    if (!findActive) {
      const updt = await BankSchema.findOneAndUpdate(
        {
          name: name,
          email: email,
          stripe_id: verifyBank.stripe_id,
        },
        {
          active: true,
        },
        { new: true },
      );
      if (!updt) {
        console.error("NO UPDATER");
        return res.status(404).json({
          error: "NO UPDATE",
        });
      }
    }
    return res.status(200).json({
      ok: "OK",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.get("/bank/datas", (req, res) => {
  return res
    .status(200)
    .sendFile(path.join(__dirname, "public", "bank-datas.html"));
});
// app.get("/stores/money", tokenVerify, async (req, res) => {
//   const { name, email } = req.user;
//   try {
//     const bankDatas = await BankSchema.findOne({
//       name: name,
//       email: email,
//     });
//     if (!bankDatas) {
//       console.error("IN BANKDATAS");
//       return res.status(404).json({
//         error: "IN BANKDATAS",
//       });
//     }
//     const storeCash = await store_data_schema.findOne({
//       name: name,
//       email: email,
//     });

//     if (!storeCash) {
//       return res.status(404).json({
//         error: "Dados da loja não encontrados",
//       });
//     }
//     const balance = Math.floor((storeCash.totalCash * 93) / 100);
//     const payout = await stripe.transfers.create({
//         amount: balance,
//         currency: "brl",
//         destination: bankDatas.stripe_id,
//         metadata: {
//           user_name: name,
//           user_email: email,
//           store_name: storeCash.storeName,
//         },
//       });
//     const updateSald = await store_data_schema.findOneAndUpdate({
//       name: name,
//       email: email
//     }, {
//       totalCash: 0
//     }, {new: true})
//     if (!updateSald) {
//       return res.status(400).json({
//         error: "Erro ao atualizar saldo"
//       });
//     }
//     console.log(`✅ Saque processado: R$ ${amount / 100} - ID: ${payout.id}`);

//     return res.status(200).json({
//       success: true,
//       message: "Saque realizado com sucesso",
//       payout: {
//         id: payout.id,
//         amount: payout.amount,
//         status: "pending",
//         estimated_arrival: "2-7 dias úteis"
//       },
//       newBalance: updatedStore.totalCash,
//       withdrawnAmount: balance
//     });
//   } catch (error) {
//     console.error("❌ Erro ao processar saque:", error);
//     return res.status(500).json({
//       error: "Erro ao processar saque",
//       message: error.message
//     });
//   }
// });
app.post("/fav-store", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { storeName } = req.body;
  try {
    const verifyFavorite = await favorite.findOne({
      name: name,
      email: email,
      storeName: storeName,
    });
    if (verifyFavorite) {
      console.error("NO VERIFY");
      return res.status(200).json({ error: "no VERIFY" });
    }

    const fav = await favorite.create({
      name: name,
      email: email,
      storeName: storeName,
    });
    if (!fav) {
      console.error("NO FAV");
      return res.status(400).json({ error: "NO FAV" });
    }

    return res.status(200).json({
      ok: "ok",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error });
  }
});
app.post("/unfav-store", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { storeName } = req.body;
  try {
    const verifyFavorite = await favorite.findOne({
      name: name,
      email: email,
      storeName: storeName,
    });
    if (!verifyFavorite) {
      console.error("NO VERIFY");
      return res.status(200).json({ error: "no VERIFY" });
    }

    const fav = await favorite.findOneAndDelete({
      name: name,
      email: email,
      storeName: storeName,
    });
    if (!fav) {
      console.error("NO FAV");
      return res.status(400).json({ error: "NO FAV" });
    }

    return res.status(200).json({
      ok: "ok",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error });
  }
});
app.post("/search/stores", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { value } = req.body;
  try {
    console.log(name, email, value);
    const inputer = value.toString().replaceAll(" ", "/");
    const store = await StoreCad.find({
      storeName: { $regex: inputer, $options: "i" },
    }).lean();

    if (!store) {
      return res.status(404).json({ message: "Loja não encontrada" });
    }
    let arr = [];
    for (let i = 0; i < store.length; i++) {
      const verifyFav = await favorite.findOne({
        name: name,
        email: email,
        storeName: store[i].storeName,
      });
      let isFav = false;
      let order = ``;
      if (verifyFav) {
        order = `<img src="https://img.icons8.com/?size=100&id=84925&format=png&color=F4D03F" alt="" id="starOff">
           <img src="https://img.icons8.com/?size=100&id=85784&format=png&color=FFFFFF" alt="" id="starOn">`;
        isFav = true;
      } else {
        order = `<img src="https://img.icons8.com/?size=100&id=85784&format=png&color=FFFFFF" alt="" id="starOff"><img src="https://img.icons8.com/?size=100&id=84925&format=png&color=F4D03F" alt="" id="starOn">`;
        isFav = false;
      }
      const verifyObs = await obsolence.findOne({
        storeName: store[i].storeName,
      });
      if (!verifyObs) {
        const htmlStructure = `<div class="store">
                        <div class="juntos">
                            <div id="img">
                                <img src="${store[i].storeImagePath}" alt="">
                            </div>
                            <div id="storeinfos">
                                <p id="storename"><strong class="GreenCard">&lt;/</strong>${store[
                                  i
                                ].storeName.replaceAll(
                                  "/",
                                  " ",
                                )}<strong class="GreenCard">/></strong></p>
                                <p id="storeDescription">${
                                  store[i].description
                                }</p>
                            </div>
                        </div>
                        <div id="moreinfos">
                            <button data-fav="${isFav}" data-storename="${
                              store[i].storeName
                            }">
                                ${order}
                            </button>
                        </div>
                    </div>`;
        arr.push(htmlStructure);
      } else {
        const hoje = new Date();
        const dataFinal = new Date(verifyObs.finisherDay);

        const diferencaMs = dataFinal - hoje;

        const daysFaltantes = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        console.log(diferencaMs);
        if (diferencaMs < 1) {
          const storef = await StoreCad.findOne({
            storeName: store[i].storeName,
          }).lean();
          if (storef) {
            const servicesDeleter = await ServicesCad.findOneAndDelete({
              storeName: store[i].storeName,
            });
            if (servicesDeleter) {
              const hourDeleter = await HoursStorage.findOneAndDelete({
                storeName: store[i].storeName,
              });
              if (hourDeleter) {
                const funcDeleter = await functionaryCad.findOneAndDelete({
                  storeName: store[i].storeName,
                });
                if (funcDeleter) {
                  const storeDeleter = await StoreCad.findOneAndDelete({
                    storeName: store[i].storeName,
                  });
                  if (!storeDeleter) {
                    return res.status(400).json({
                      error: "errooooooooooooooooooooooooooooooooooooor",
                    });
                  }
                }
              }
            }
          }
        }
        const htmlStructure = `<div class="store obsolete-store">
                        <div class="juntos">
                            <div id="img">
                                <img src="${store[i].storeImagePath}" alt="">
                            </div>
                            <div id="storeinfos">
                                <p id="storename"><strong class="GreenCard">&lt;/</strong>${store[
                                  i
                                ].storeName.replaceAll(
                                  "/",
                                  " ",
                                )}<strong class="GreenCard">/></strong></p>
                                <p id="storeDescription">This store has been deleter in  <strong class="jsonWrite" style="margin-left:10px;"> ${daysFaltantes} days</strong></p>
                            </div>
                        </div>
                        <div id="moreinfos">
                            <button>
                                <img src="https://img.icons8.com/?size=100&id=110674&format=png&color=FFFFFF">
                            </button>
                        </div>
                    </div>`;
        arr.push(htmlStructure);
      }
    }

    return res.status(200).json({
      html: arr.join(""),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
});
app.post("/pay/ass", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { plan, price, log } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: [
        "card", // Cartão de crédito/débito
      ],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: plan,
            },
            unit_amount: price,
            recurring: {
              // ✅ OBRIGATÓRIO para subscription
              interval: "month", // ou 'year', 'week', 'day'
            },
          },
          quantity: 1,
        },
      ],
      success_url: `http://localhost:3000/finish/pay/ass?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:3000/pay/plans`,
      customer_email: email,
      metadata: {
        userId: req.user.id,
        planName: plan,
        userName: name,
        userEmail: email,
        planPrice: price,
      },
    });
    if (!session) {
      return res.status(400).json({ error: "ERROR in payment :(" });
    }

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return res.status(500).json({
      error: "Erro ao processar pagamento",
      details: error.message,
    });
  }
});
app.get("/finish/pay/ass", async (req, res) => {
  const session_id = req.query.session_id;

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const { planName, userName, userEmail, planPrice } = session.metadata;
    if (session.payment_status === "paid") {
      const stripeId = session.subscription;
      const requiem = await storePlan.findOne({
        name: userName,
        email: userEmail,
        subscriptionId: stripeId,
      });
      if (requiem) {
        console.log("REQUIEM");
        return res.status(404).json({
          eror: "REQUIEM",
        });
      }
      const requiemFinal = await storePlan.create({
        name: userName,
        email: userEmail,
        subscriptionId: stripeId,
      });
      if (!requiemFinal) {
        console.log("REQUIEMFINAL");
        return res.status(404).json({
          eror: "REQUIEMFINAL",
        });
      }
      return res.redirect("/cad/store");
    }
  } catch (error) {}
});
app.post("/prePayModify", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { type } = req.body;
  try {
    if (type) {
      const storeUp = await store_data_schema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          prePayment: false,
        },
        { new: true },
      );
      if (!storeUp) {
        console.log(storeUp);
        return res.status(400).json({
          erro: "NO STOREUP",
        });
      }
      return res.status(200).json({
        storeUp: true,
      });
    } else {
      const storeUp = await store_data_schema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          prePayment: true,
        },
        { new: true },
      );
      if (!storeUp) {
        console.log(storeUp);
        return res.status(400).json({
          erro: "NO STOREUP",
        });
      }
      return res.status(200).json({
        storeUp: true,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erorr: error });
  }
});
app.get("/stores/del", tokenVerify, (req, res) => {
  return res
    .status(200)
    .sendFile(path.join(__dirname, "public", "stores-deleter.html"));
});
app.get("/obsolence/rend", tokenVerify, async (req, res) => {
  const { name, email } = req.user;

  try {
    const obs = await obsolence.findOne({
      name: name,
      email: email,
    });
    let stcr = ``;

    if (!obs) {
      stcr = `<div class="obsolenceDiv columnUnion">
              <div class="obsolenceDiv-text">
                <div class="obsolenceDiv-titles">
                  <h1>
                    Store <strong class="jsonWrite">Obsolescence</strong> Mode
                  </h1>
                </div>
                <div class="obsolenceDiv-instructions">
                  <p>
                    Activating Obsolescence Mode will
                    <strong class="jsonWrite">immediately disable</strong> new
                    appointments and cancel your subscription. Your store will
                    remain active for
                    <strong class="jsonWrite">32 days</strong> to complete all
                    existing scheduled appointments, after which all data will
                    be <strong class="jsonWrite">permanently deleted</strong>.
                    This action is irreversible and cannot be undone under any
                    circumstances<strong class="pointer">.</strong>
                  </p>
                </div>
              </div>
              <div class="obsolenceDiv-call">
                <img
                  src="https://img.icons8.com/?size=100&id=120871&format=png&color=FFFFFF"
                  alt=""
                />
              </div>
            </div>`;
    } else {
      const hoje = new Date();
      const dataFinal = new Date(obs.finisherDay);

      const diferencaMs = dataFinal - hoje;
      let divisor = 1000 * 60 * 60 * 24;
      console.log(hoje, dataFinal, diferencaMs);
      const diasRestantes = Math.floor(diferencaMs / divisor);
      let d = obs.starterDay.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
      let f = obs.finisherDay.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "numeric",
        year: "numeric",
      });
      if (diferencaMs < 1) {
        const store = await StoreCad.findOne({
          name: name,
          email: email,
        }).lean();
        if (store) {
          const servicesDeleter = await ServicesCad.findOneAndDelete({
            name: name,
            email: email,
          });
          if (servicesDeleter) {
            const hourDeleter = await HoursStorage.findOneAndDelete({
              storeName: store.storeName,
              storeEmail: store.storeEmail,
            });
            if (hourDeleter) {
              const funcDeleter = await functionaryCad.findOneAndDelete({
                name: name,
                email: email,
              });
              if (funcDeleter) {
                const storeDeleter = await StoreCad.findOneAndDelete({
                  name: name,
                  email: email,
                });
                if (!storeDeleter) {
                  return res
                    .status(400)
                    .json({
                      error: "errooooooooooooooooooooooooooooooooooooor",
                    });
                }
              }
            }
          }
        }
      }
      const schedu = await scheduleSchema
        .find({
          storeName: obs.storeName,
        })
        .lean();
      if (!schedu) {
        return res.status(404).json({
          error: "sch",
        });
      }
      let visitantes = schedu.length;
      stcr = `<div class="unionE"><div class="Identifire"><h1><strong class="consoleWrite">${obs.storeName.replaceAll("/", " ")}</strong> is obsolete</h1><p>Started at ${d} and finish at ${f}</p> </div><div class="dateNasc">
      <span class="label">Ends  <strong class="GreenCard"> on</strong></span><br>
      <span class="dateSpan">${f}</span>
      </div></div><div class="unionE" style="margin-left:5vw;"><div class="analyticsInfo"><span class="label"><strong class="GreenCard">Total</strong> Schedules Remain </span><br><span class="Numbera">${visitantes}</span> </div><div class="analyticsInfo"><span class="label"><strong class="GreenCard">Total</strong> Days Remain </span><br><span class="Numbera">${diasRestantes}</span> </div></div> `;
    }
    return res.status(200).json({ returner: stcr });
  } catch (error) {
    console.log("QUE MERDA BRO");
    return res.status(500).json({
      jay: "IS GAY",
    });
  }
});
app.get("/starter/obsolence", tokenVerify, async (req, res) => {
  const { name, email } = req.user;

  try {
    const today = new Date();
    const em32Dias = new Date();
    em32Dias.setDate(today.getDate() + 32);

    console.log(today, em32Dias);

    const storeFind = await StoreCad.findOne({
      name: name,
      email: email,
    });
    if (!storeFind) {
      return res.status(404).json({
        error: "EM STOREFIND",
      });
    }
    const finderStripeId = await storePlan.findOne({
      name: name,
      email: email,
    });
    if (!finderStripeId) {
      return res.status(404).json({
        totalErr: "EM STRIPE ID",
      });
    }
    const cancel = await stripe.subscriptions.cancel(
      finderStripeId.subscriptionId,
    );
    const createrObsolete = await obsolence.create({
      name: name,
      email: email,
      storeName: storeFind.storeName,
      starterDay: today,
      finisherDay: em32Dias,
    });
    if (!createrObsolete) {
      return res.status(400).json({
        erorr: "CREATEROBSOLETE",
      });
    }
    return res.status(200).json({
      ok: "ok",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error,
    });
  }
});
app.post("/update/bank", tokenVerify, async (req, res) => {
  const { name, email } = req.user;
  const { holder_name, holder_type, bank_code, branch_code, account_number } =
    req.body;
  console.log("📦 Dados recebidos:", {
    holder_name,
    holder_type,
    bank_code,
    branch_code,
    account_number,
  });
  try {
    // console.log(registerData);
    const bankDatas = await BankSchema.findOne({
      name: name,
      email: email,
    });
    if (bankDatas) {
      const loginLink = await stripe.accounts.createLoginLink(
        bankDatas.stripe_id,
      );
      const criptNumber = criptografar(account_number.toString());
      const cadBankDatas = await BankSchema.findOneAndUpdate(
        {
          name: name,
          email: email,
        },
        {
          holder_name: holder_name,
          holder_type: holder_type,
          bank_code: bank_code,
          branch_code: branch_code,
          stripe_id: bankDatas.stripe_id,
          account_number: criptNumber,
          active: true,
        },
      );
      if (cadBankDatas) {
        return res.redirect(loginLink.url);
      }
    }
    return res.status(404).json({ error: "Usuario ja cadastrado" });
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: error.message });
  }
});
app.get("/login-redirect", async (req, res) => {
  return res
    .status(200)
    .sendFile(path.join(__dirname, "public", "login-redirect.html"));
});
app.get("/stripeDashBoard", tokenVerify, async (req, res) => {
  const {name, email} = req.user;

  try {
  const bankDatas = await BankSchema.findOne({
      name: name,
      email: email,
    });
    if (bankDatas) {
      const loginLink = await stripe.accounts.createLoginLink(
        bankDatas.stripe_id,
      );
      return res.redirect(loginLink.url)
    }
    return res.redirect("/stores/home")
  } catch (error) {
    return res.redirect("/stores/home")
  }
})
app.get("/register/whilewhale-datas", async (req, res) => {
  const type = req.query.data
  console.log(type)
  let tipo = type.replaceAll("'", "")
  const updt = await ads.findOne()
  if (!updt){
    return res.status(404).redirect("/pay/plans")
  }
  let key = "ads"
  console.log(tipo)
  switch (tipo) {
    case "search":
      updt.search += 1

      await updt.save()
      break;
    case "friends":
      updt.friends += 1

      await updt.save()

      break;
    default:
      updt.ads += 1

      await updt.save()

      break;
  }
  return res.status(200).redirect("/pay/plans")
})
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📧 Sistema de recuperação de senha ativo`);
});

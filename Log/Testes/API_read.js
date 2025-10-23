import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import User from "../Console/Loginschema.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI não definido no .env");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("JWT_SECRET não definido no .env");
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

function verificarToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    req.userIsStore = decoded.isStore;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// Login
app.post("/readFormRes", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Em login, o comum é exigir email e senha
    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    // Certifique-se que os campos aqui batem com os do seu schema (Email, nome, password)
    const user = await User.findOne({ Email: email });
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Se você também quer conferir o nome, mantenha esta validação opcional
    if (name && user.nome !== name) {
      return res.status(400).json({ message: "Nome não confere com o cadastro." });
    }

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const payload = {
      id: user._id.toString(),
      email: user.Email,
      name: user.nome,
      isStore: !!user.isStore
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

    // Cookie httpOnly: não é legível no frontend (segurança)
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", // se o front estiver no mesmo domínio. Se for outro domínio, usar 'none' e configurar CORS e HTTPS.
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      message: "Usuário autenticado com sucesso.",
      user: payload // opcional retornar dados básicos também no corpo
    });
  } catch (error) {
    console.error("Erro em /readFormRes:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Retorna dados do usuário logado com base no cookie
app.get("/api/me", verificarToken, async (req, res) => {
  try {
    // Você pode confiar no token ou recarregar do banco para frescor
    // const user = await User.findById(req.userId).select("nome Email isStore");
    // return res.json({ id: user._id, email: user.Email, name: user.nome, isStore: user.isStore });

    return res.json({
      id: req.userId,
      email: req.userEmail,
      name: req.userName,
      isStore: req.userIsStore
    });
  } catch (error) {
    console.error("Erro em /api/me:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  return res.status(200).json({ message: "Logout efetuado." });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado ao MongoDB");
    app.listen(PORT, () => console.log(`Servidor ouvindo em http://localhost:${PORT}`));
  } catch (err) {
    console.error("Falha ao iniciar:", err);
    process.exit(1);
  }
}
start();
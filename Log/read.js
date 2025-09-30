import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI não definido no .env");
  process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Schema e Model (nome/email)
const userSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);


// POST /readFormRes - verifica se existe usuário com name/email
app.post("/readFormRes", async (req, res) => {
  try {
    const { name, email } = req.body; // campos do form
    if (!name || !email) {
      return res.status(400).json({ message: "name e email são obrigatórios." });
    }
    const exists = await User.exists({ nome: name, Email: email });
    return res.status(200).json({ exist: !!exists });
  } catch (error) {
    console.error("Erro em /readFormRes:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
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
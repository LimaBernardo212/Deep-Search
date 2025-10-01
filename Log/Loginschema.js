import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
        nome: String,
        Email: String,
        password: String,
        isStore: Boolean,
    })
    export default mongoose.model("usuarios", UserSchema);
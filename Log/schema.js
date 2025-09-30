import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
        nome: String,
        Email: String
    })
    export default mongoose.model("User", UserSchema);
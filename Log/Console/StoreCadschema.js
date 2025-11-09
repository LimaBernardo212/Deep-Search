import mongoose from "mongoose";
const StoreCadSchema = new mongoose.Schema({
    name: String,
    email: String,
    description: String,
    storeName: String,
    address: String,
    cnpj: String,
    phone: String,
    storeEmail: String
})
export default mongoose.model("Storecad", StoreCadSchema);
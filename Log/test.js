import mongoose from "mongoose";
const vendaSchema = new mongoose.Schema({
    mes: Number,
    valor: Number,
})
export default mongoose.model('Venda', vendaSchema);
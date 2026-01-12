import mongoose from "mongoose";
const reembolso = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    totalPrice: Number
})
export default mongoose.model("reembolso", reembolso)
import mongoose from "mongoose";
const datas = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    totalMoney: Number,
    recurringType: Boolean, //True E comprador e false e comprador e assinante
    scheduleNumber: Number,
    planNumber: Number,
    cancelNumber: Number
})
export default mongoose.model("client_infos", datas);
import mongoose from "mongoose";
const datas = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    storeEmail: String,
    totalCash: Number,
    closedChoice: Array,
    totalVisits: Number,
    totalAppointments: Number,
})
export default mongoose.model("store_datas", datas);
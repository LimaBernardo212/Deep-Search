import mongoose from "mongoose";
const StoreCadSchema = new mongoose.Schema({
    name: String,
    email: String,
    description: String,
    closedHours: String,
    closedDays: String,
    openHours: String,
    model: Number,
    storeName: String,
    address: String,
    cnpj: String,
    phone: String,
    storeEmail: String,
    type: String,
    storeImagePath: {type: String, default: []},
    storeImageMeta: {type: [mongoose.Schema.Types.Mixed], default: []}
})
export default mongoose.model("Storecad", StoreCadSchema);
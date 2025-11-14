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
    functionary: Array,
    functionaryImagePath: {type: String, default: []},
    functionaryImageMeta: {type: [mongoose.Schema.Types.Mixed], default: []},
    storeImagePath: {type: String, default: []},
    storeImageMeta: {type: [mongoose.Schema.Types.Mixed], default: []}
})
export default mongoose.model("Storecad", StoreCadSchema);
import mongoose from "mongoose";
const functionarySchema = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    storeEmail: String,
    phone: String,
    functionarysName: Array,
    functionarysEmail: Array,
    functionaryImagePath:{ type: Array, default: [] },
    functionaryImageMeta: { type: Array, default: [] }
})
export default mongoose.model("functionarys", functionarySchema)
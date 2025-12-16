import mongoose from "mongoose";
const ServiceCadSchema = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    storeEmail: String,
    phone: String,
    serviceName: Array,
    serviceDesc: Array,
    servicePrice: Array,
    serviceImagePath: { type: Array, default: [] },
    serviceImageMeta: { type: Array, default: [] },
});
export default mongoose.model('ServicesCad', ServiceCadSchema);
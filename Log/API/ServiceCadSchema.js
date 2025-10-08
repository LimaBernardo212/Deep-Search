import mongoose from "mongoose";
const ServiceCadSchema = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    storeEmail: String,
    phone: String,
    serviceName: Array,
    serviceDesc: Array,
    servicePrice: Array
});
export default mongoose.model('ServiceCad', ServiceCadSchema);
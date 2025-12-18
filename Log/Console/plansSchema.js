import mongoose from "mongoose";
const Plans = new mongoose.Schema({
        name: String,
        email: String,
        storeName: String,
        planCode: Array,
        planName: Array,
        planOriginalName: Array,
        planPrice: Array,
        planDescription: Array,
        planStripeCode: Array
    })
    export default mongoose.model("plansData", Plans);
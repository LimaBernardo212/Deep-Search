import mongoose from "mongoose";
const Plans = new mongoose.Schema({
        name: String,
        email: String,
        planName: String,
        planPrice: Number,
        subscriptionId: String,
        subscritionDay: String,
    })
    export default mongoose.model("MyPlans", Plans);
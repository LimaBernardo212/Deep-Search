import mongoose from "mongoose";
const Plans = new mongoose.Schema({
        name: String,
        email: String,
        subscriptionId: String,
    })
    export default mongoose.model("logtoplans", Plans);
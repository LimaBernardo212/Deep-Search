import mongoose from "mongoose";
const Plans = new mongoose.Schema({
        name: String,
        email: String,
        storeName: String,
        starterDay: Date,
        finisherDay: Date
    })
    export default mongoose.model("obsolence_store", Plans);
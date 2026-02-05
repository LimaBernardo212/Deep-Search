import mongoose from "mongoose";
const ads = new mongoose.Schema({
        ads: Number,
        friends: Number,
        search: Number,
    })
    export default mongoose.model("AdsDatas", ads);
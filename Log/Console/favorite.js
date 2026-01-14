import mongoose from "mongoose";
const favorite = new mongoose.Schema({
        name: String,
        email: String,
        storeName: String,
    })
export default mongoose.model("my_favorites", favorite);
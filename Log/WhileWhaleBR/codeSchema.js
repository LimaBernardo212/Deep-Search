 import mongoose from "mongoose"
 
 const coding = new mongoose.Schema({
        nome:String,
        email: String,
        code: String
    })
    export default mongoose.model('code', coding)

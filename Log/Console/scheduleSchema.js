import mongoose from "mongoose";
const scheduleSchema = new mongoose.Schema({
    name: String,
    email: String,
    functionary: String,
    hour: String,
    services: Array,
    day: String,
    storeName: String,
    payed: Boolean,
    totalPrice: Number,
    stripeId: String
})
export default mongoose.model("schedules", scheduleSchema)
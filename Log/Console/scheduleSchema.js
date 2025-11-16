import mongoose from "mongoose";
const scheduleSchema = new mongoose.Schema({
    name: String,
    email: String,
    functionary: String,
    hour: String,
    services: String,
    day: String
})
export default mongoose.model("schedules", scheduleSchema)
import mongoose from 'mongoose';

const HourSchema = new mongoose.Schema(
  {
    storeName:   String ,
    storeEmail:   String,
    phone:   String,
    hour: { type: [String], default: [] },
  }
);

// Usa cache para evitar OverwriteModelError em hot-reload
export default mongoose.models['hoursStorage'] || mongoose.model('hoursStorage', HourSchema);
import mongoose from "mongoose";
const reembolso = new mongoose.Schema({
    name: String,
    email: String,
    storeName: String,
    totalPrice: Number,
    scheduleId: String,
  stripeRefundId: String,
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}
)
export default mongoose.model("reembolso", reembolso)
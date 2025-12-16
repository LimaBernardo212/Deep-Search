import mongoose from "mongoose";
const BankAndPlans = new mongoose.Schema({
        name: String,
        email: String,
        holder_name: String,
        holder_type: String,
        bank_code: String,
        branch_code: String,
        tax_id: String,
        stripe_id: String,
        account_number: String
    })
    export default mongoose.model("bank", BankAndPlans);
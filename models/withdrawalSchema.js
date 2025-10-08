import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    paymentMethod: { type: String, enum: ["bank", "paypal"], required: true },
    withdrawalAmount: { type: Number, required: true },
    tdsAmount: { type: Number, required: true },
  
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "CANCELLED", "FAILED","REJECTED"],
      default: "PENDING",
    },
    rejectReason: { type: String },

  },
  { timestamps: true }
);

const Withdrawals =
  mongoose.models.Withdrawals ||
  mongoose.model("Withdrawals", WithdrawalSchema);

export default Withdrawals;

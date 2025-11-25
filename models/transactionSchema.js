import mongoose from "mongoose";


const transactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      enum: ["PAY","COMMISSION", "WITHDRAWAL", "REFUND", "RECHARGE"],
      required: true,
    },
    method: {
      type: String,
      enum: ["BANK", "RAZORPAY"],
      // required: true,
    },
    refId: { type: mongoose.Schema.Types.ObjectId }, // ref to Commissions, Withdrawals, etc.
    amount: { type: Number, required: true },
    tdsAmount: { type: Number, default: 0 },
    message: { type: String },
    status: {
      type: String,
      enum: ["UNPAID", "PAID", "CANCELLED"],
      default: "UNPAID",
    },
  },
  { timestamps: true }
);

// ✅ Ensure unique wallet per user-admin pair

export const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);

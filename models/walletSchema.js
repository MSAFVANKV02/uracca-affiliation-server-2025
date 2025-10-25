import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    totalAmount: { type: Number, default: 0 },      // total earned including pending & paid
    pendingAmount: { type: Number, default: 0 },    // yet-to-be-paid commissions
    paidAmount: { type: Number, default: 0 },       // already paid out
    cancelledAmount: { type: Number, default: 0 },  // cancelled commissions
    commissionAmount: { type: Number, default: 0 }, // total commission earned
    balanceAmount: { type: Number, default: 0 },    // available balance for withdrawal

    transactions: [
      {
        type: { type: String, enum: ["COMMISSION", "WITHDRAWAL", "REFUND"], required: true },
        refId: { type: mongoose.Schema.Types.ObjectId }, // ref to Commissions, Withdrawals, etc.
        amount: { type: Number, required: true },
        tdsAmount: { type: Number, default: 0 },
        status: { type: String, enum: ["PENDING", "PAID", "CANCELLED"], default: "PENDING" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Ensure unique wallet per user-admin pair
walletSchema.index({ userId: 1, adminId: 1 }, { unique: true });

export const Wallet =
  mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);

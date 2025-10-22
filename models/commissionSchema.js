import mongoose from "mongoose";

const commissionRecordSchema = new mongoose.Schema({
  orderId: String,
  adminId:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userId:{ type: mongoose.Schema.Types.ObjectId, ref: "User" },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  //   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  commissionAmount: { type: Number, required: true },
  purchaseAmount: { type: Number, required: true },
  tdsAmount: { type: Number, default: 0 }, // TDS per transaction
  finalCommission: { type: Number, default: 0 }, // after TDS deduction
  status: {
    type: String,
    enum: ["PENDING", "PAID", "CANCELLED"],
    default: "PENDING",
  },
  createdAt: { type: Date, default: Date.now },
});

export const Commissions =
  mongoose.models.Commissions ||
  mongoose.model("Commissions", commissionRecordSchema);

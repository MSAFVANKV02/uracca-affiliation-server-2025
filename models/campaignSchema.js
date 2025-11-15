import mongoose from "mongoose";

// const commissionRecordSchema = new mongoose.Schema({
//   orderId: String,
//   //   productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//   commissionAmount: { type: Number, required: true },
//   purchaseAmount: { type: Number, required: true },
//   tdsAmount: { type: Number, default: 0 }, // TDS per transaction
//   finalCommission: { type: Number, default: 0 }, // after TDS deduction
//   status: {
//     type: String,
//     enum: ["PENDING", "PAID", "CANCELLED"],
//     default: "PENDING",
//   },
//   createdAt: { type: Date, default: Date.now },
// });

const campaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: {
    domain: String,
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  campaignLink: String,
  returnPeriod: { type: Number, default: 1 },
  campaignAccessKey: String,
  clicks: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },

  // Commission summary
  commissionDetails: {
    totalCommission: { type: Number, default: 0 },
    totalCommissionWithTds: { type: Number, default: 0 },
    totalCommissionPercentage: { type: Number, default: 0 },
    pendingCommission: { type: Number, default: 0 },
    paidCommission: { type: Number, default: 0 },
    totalTdsCutOff: { type: Number, default: 0 }, // total TDS deducted
  },

  // Per order commission history
  // commissionRecords: [commissionRecordSchema],
  commissionRecords: [{ type: mongoose.Schema.Types.ObjectId, ref: "Commissions" }],

  // Product linked to this campaign
  product: {
    image: String,
    title: String,
    mrp: String,
    category: String,
    categoryId: String,
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },

  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "PAUSED", "ENDED", "HOLD"],
    default: "ACTIVE",
  },
});

export const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);

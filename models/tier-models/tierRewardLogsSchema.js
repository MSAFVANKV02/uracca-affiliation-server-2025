import mongoose from "mongoose";

const tierRewardLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: "Platform", required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
    levelNumber: Number,

    rewardType: { type: String, enum: ["CASH", "COINS", "SPIN", "SCRATCHCARD"] },
    rewardValue: Number,

    status: { type: String, enum: ["PENDING", "PROCESSING", "PAID"], default: "PENDING" },

    action: { type: String, enum: ["LEVEL_COMPLETED", "TIER_COMPLETED", "REWARD_EARNED"] },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TierRewardLog =
  mongoose.models.TierRewardLog ||
  mongoose.model("TierRewardLog", tierRewardLogSchema);

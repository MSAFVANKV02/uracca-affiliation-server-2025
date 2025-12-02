import mongoose from "mongoose";

const tierRewardLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: "Platform", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
    levelNumber: Number,

    rewardType: { type: String },       // CASH, COINS, SPIN, SCRATCHCARD
    rewardMethod: { type: String },     // SPIN or SCRATCHCARD
    rewardValue: { type: String },      
    valueType: { type: String },        
    rewardLabel: { type: String },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID"],
      default: "PENDING",
    },

    // ⭐ user interaction
    isClaimed: { type: Boolean, default: false },
    isCollected: { type: Boolean, default: false },
    claimedAt: Date,
    collectedAt: Date,

    // ⭐ spin or scratch results
    spinResult: String,
    scratchResult: String,

    action: {
      type: String,
      enum: ["LEVEL_COMPLETED", "TIER_COMPLETED", "REWARD_EARNED"],
    },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


export const TierRewardLog =
  mongoose.models.TierRewardLog ||
  mongoose.model("TierRewardLog", tierRewardLogSchema);

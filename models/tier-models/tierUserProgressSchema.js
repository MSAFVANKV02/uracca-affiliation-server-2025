import mongoose from "mongoose";

const progressHistorySchema = new mongoose.Schema({
  tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
  levelNumber: Number,
  achievedAt: Date,
});

const userTierProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: "Platform", required: true },

    currentTierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
    currentLevel: { type: Number, default: 1 },                         // ex: Level 2 under Bronze
    isTierCompleted: { type: Boolean, default: false },

    progressHistory: [progressHistorySchema],  
    goalProgress: {
      orders: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      sales:  { type: Number, default: 0 },
    },
                             // all past tiers and levels

    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserTierProgress =
  mongoose.models.UserTierProgress ||
  mongoose.model("UserTierProgress", userTierProgressSchema);

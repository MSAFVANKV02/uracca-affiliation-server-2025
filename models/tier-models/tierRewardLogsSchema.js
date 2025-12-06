// import mongoose from "mongoose";

// const tierRewardLogSchema = new mongoose.Schema(
//   {
//     adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     platformId: { type: mongoose.Schema.Types.ObjectId, ref: "Platform", required: true },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

//     tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
//     levelNumber: Number,

//     rewardType: { type: String },       // CASH, COINS, SPIN, SCRATCHCARD
//     rewardMethod: { type: String },     // SPIN or SCRATCHCARD
//     // rewardValue: { type: String },
//     rewardValue: { type: Number, required: true },
//     levelRewardId: { type: String },

//     valueType: { type: String },
//     rewardLabel: { type: String },
//     image: { type: String,  },

//     status: {
//       type: String,
//       enum: ["PENDING", "PROCESSING", "PAID"],
//       default: "PENDING",
//     },

//     // ⭐ user interaction
//     isClaimed: { type: Boolean, default: false },
//     isCollected: { type: Boolean, default: false },
//     claimedAt: Date,
//     collectedAt: Date,

//     // ⭐ spin or scratch results
//     spinResult: String,
//     scratchResult: String,

//     action: {
//       type: String,
//       enum: ["LEVEL_COMPLETED", "TIER_COMPLETED", "REWARD_EARNED", "REWARD_COLLECTED"],
//     },

//     date: { type: Date, default: Date.now },
//   },
//   { timestamps: true }
// );

// export const TierRewardLog =
//   mongoose.models.TierRewardLog ||
//   mongoose.model("TierRewardLog", tierRewardLogSchema);
// models/tier-models/tierRewardLogsSchema.js
import mongoose from "mongoose";

// ⭐ NEW: embedded reward item schema — one log can store many rewards
const rewardItemSchema = new mongoose.Schema(
  {
    levelRewardId: { type: String }, // Tier.levels[i].rewards[j]._id
    rewardType: { type: String }, // CASH, COINS, SPIN, etc.
    rewardLabel: { type: String },
    rewardValue: { type: Number },
    valueType: { type: String }, // e.g. "FIXED", "PERCENT"
    image: { type: String },
    color: { type: String },
    textColor: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const collectedRewardSchema = new mongoose.Schema({
  // method: { type: String, enum: ["SPIN", "SCRATCHCARD"], required: true },
  rewardType: { type: String },
  label: { type: String },
  valueType: { type: String },
  // value: { type: String, required: true },
  value: { type: Number, required: true },

  color: { type: String },
  textColor: { type: String },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  isClaimed: { type: Boolean, default: false },
  isCollected: { type: Boolean, default: false },
  claimedAt: Date,
  collectedAt: Date,
  deliveredAt: Date,
});

const tierRewardLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collectedRewards: [collectedRewardSchema],

    platformId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Platform",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
    levelNumber: Number,
    spinCount: {
      type: Number,
      default: 1,
    },

    // ⭐ UPDATED: rewardMethod stays on root, but individual reward fields
    // moved into rewards[]
    rewardMethod: {
      type: String,
      enum: ["SPIN", "SCRATCHCARD"],
    },

    // ⭐ UPDATED: one doc per level, with all rewards stored here
    rewards: [rewardItemSchema],
    levelId: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID"],
      default: "PENDING",
    },

    // ⭐ user interaction
    isClaimed: { type: Boolean, default: false },
    isCollected: { type: Boolean, default: false },
    isDelivered: { type: Boolean, default: false },

    claimedAt: Date,
    collectedAt: Date,
    deliveredAt: Date,
    // ⭐ spin or scratch results (if you want to store the outcome)
    spinResult: String,
    scratchResult: String,

    action: {
      type: String,
      enum: [
        "LEVEL_COMPLETED",
        "TIER_COMPLETED",
        "REWARD_EARNED",
        "REWARD_COLLECTED",
        "REWARD_GIVEN",
      ],
    },

    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const TierRewardLog =
  mongoose.models.TierRewardLog ||
  mongoose.model("TierRewardLog", tierRewardLogSchema);

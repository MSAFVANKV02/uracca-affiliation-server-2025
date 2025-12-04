import mongoose from "mongoose";

// const progressHistorySchema = new mongoose.Schema({
//   tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
//   levelNumber: Number,
//   achievedAt: Date,
// });
// UPDATED ↓↓↓
const progressHistorySchema = new mongoose.Schema({
  tierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
  levelNumber: Number,
  achievedAt: Date,

  goals: [
    {
      goalId: String,
      goalType: String,
      target: Number,
      progress: Number,
      isCompleted: Boolean,
    }
  ]
});



// Each goal in the current level has its own progress
const goalProgressSchema = new mongoose.Schema(
  {
    goalId: { type: String, required: true }, // level.goals[i]._id
    goalType: {
      type: String,
      enum: ["ORDERS", "CLICKS", "SALES"],
      required: true,
    },
    target: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const userTierProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: "Platform", required: true },

    currentTierId: { type: mongoose.Schema.Types.ObjectId, ref: "Tier" },
    currentLevel: { type: Number, default: 1 },                         // ex: Level 2 under Bronze
    isTierCompleted: { type: Boolean, default: false },

    progressHistory: [progressHistorySchema],  
    // goalProgress: {
    //   orders: { type: Number, default: 0 },
    //   clicks: { type: Number, default: 0 },
    //   sales:  { type: Number, default: 0 },
    // },
    // goalProgress: [
    //   {
    //     goalId: String,     // unique per goal in the tier
    //     progress: { type: Number, default: 0 },
    //     completed: { type: Boolean, default: false }
    //   }
    // ],
    goalProgress: [goalProgressSchema],
      
                             // all past tiers and levels

    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const UserTierProgress =
  mongoose.models.UserTierProgress ||
  mongoose.model("UserTierProgress", userTierProgressSchema);

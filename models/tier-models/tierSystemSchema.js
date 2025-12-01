import mongoose from "mongoose";

/* ---------------------- Level Setup Inside Each Tier ---------------------- */

const levelRewardSchema = new mongoose.Schema({
  // method: { type: String, enum: ["SPIN", "SCRATCHCARD"], required: true },
  rewardType: { type: String },
  label: { type: String, required: true },
  type: { type: String },
  value: { type: String, required: true },
  color: { type: String, required: true },
  textColor: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const levelGoalSchema = new mongoose.Schema({
  goalType: {
    type: String,
    enum: ["ORDERS", "CLICKS", "SALES"],
    required: true,
  },
  target: { type: Number, required: true },
});

const tierLevelSchema = new mongoose.Schema({
  levelNumber: { type: Number, required: true }, // Level 1, Level 2, Level 3...
  timePeriod:{ type: String, default:"NONE" },
  rewards: [levelRewardSchema],
  goals: [levelGoalSchema], // Multiple goals
  rewardMethod: { type: String, enum: ["SPIN", "SCRATCHCARD"], required: true },
  createdAt: { type: Date, default: Date.now },
});

/* ---------------------------- Tier Main Schema ---------------------------- */

const tierSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    platformId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Platform",
      required: true,
    },

    tierName: { type: String, required: true }, // Silver / Gold / etc.
    description: { type: String },

    order: { type: Number, default: 1 }, // Tier sorting (Starter=1, Bronze=2...)

    levels: [tierLevelSchema], // Array of levels
  },
  { timestamps: true }
);

export const Tier = mongoose.models.Tier || mongoose.model("Tier", tierSchema);

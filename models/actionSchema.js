import mongoose from "mongoose";

const dailyActionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // admin user was workingUnder on that day
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },

  clicks: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  activeCampaigns: { type: Number, default: 0 },
  paidCommission: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Prevent duplicate entries for same user + day
dailyActionSchema.index({ userId: 1, adminId: 1, date: 1 }, { unique: true });

const DailyAction =
  mongoose.models.DailyAction ||
  mongoose.model("DailyAction", dailyActionSchema);
export default DailyAction;

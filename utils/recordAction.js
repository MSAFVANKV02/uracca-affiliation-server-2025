

import DailyAction from "../models/actionSchema.js";
import AffUser from "../models/aff-user.js";

export const RecordAction = async (userId, action) => {
  const today = new Date().toISOString().slice(0, 10);

  // get the admin the user is working under right now
  const user = await AffUser.findById(userId).select("workingOn");
  const adminId = user?.workingOn;

  if (!adminId) return; // or throw error depending on business logic

  await DailyAction.findOneAndUpdate(
    { userId, adminId, date: today },
    {
      $inc: {
        clicks: action.clicks || 0,
        orders: action.orders || 0,
        sales: action.sales || 0,
      },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, new: true }
  );
};

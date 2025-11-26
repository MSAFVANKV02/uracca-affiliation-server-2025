// import DailyAction from "../models/actionSchema.js";
// import AffUser from "../models/aff-user.js";

// export const RecordAction = async (userId, action) => {
//   const today = new Date().toISOString().slice(0, 10);

//   // get the admin the user is working under right now
//   const user = await AffUser.findById(userId).select("workingOn");
//   const adminId = user?.workingOn;

//   if (!adminId) return; // or throw error depending on business logic

//   await DailyAction.findOneAndUpdate(
//     { userId, adminId, date: today },
//     {
//       $inc: {
//         clicks: action.clicks || 0,
//         orders: action.orders || 0,
//         sales: action.sales || 0,
//       },
//       $set: { updatedAt: new Date() },
//     },
//     { upsert: true, new: true }
//   );
// };
import DailyAction from "../models/actionSchema.js";

export class DailyActionUpdater {
  // constructor(userId, adminId) {
  //   this.userId = userId;
  //   this.adminId = adminId;
  //   this.today = new Date().toISOString().slice(0, 10);
  //   this.updateOps = {};
  // }
  constructor(userId, adminId = null) {
    this.userId = userId;
    this.adminId = adminId; // optional
    this.today = new Date().toISOString().slice(0, 10);
    this.updateOps = {};
  }

  // auto load adminId if missing
  async loadAdmin() {
    if (!this.adminId) {
      const user = await AffUser.findById(this.userId).select("workingOn");
      this.adminId = user?.workingOn;
    }
  }

  // -----------------------------
  // INCREMENT SAFELY
  // -----------------------------
  increment(field, value = 1) {
    if (!this.updateOps[field]) this.updateOps[field] = 0;
    this.updateOps[field] += Math.abs(value); // always positive
    return this;
  }

  // -----------------------------
  // DECREMENT SAFELY
  // -----------------------------
  decrement(field, value = 1) {
    if (!this.updateOps[field]) this.updateOps[field] = 0;
    this.updateOps[field] -= Math.abs(value); // always negative
    return this;
  }

  // -----------------------------
  // CONDITIONAL UPDATE
  // -----------------------------
  setIf(field, value, condition = true) {
    if (condition) {
      if (!this.updateOps[field]) this.updateOps[field] = 0;
      this.updateOps[field] += value;
    }
    return this;
  }

  // -----------------------------
  // APPLY TO DATABASE
  // -----------------------------
  async apply() {
    await this.loadAdmin(); // ⬅️ auto fetch admin if not passed

    if (!this.adminId) {
      console.warn("⚠ DailyActionUpdater: adminId not found for user", this.userId);
      return;
    }

    const doc = await DailyAction.findOne({
      userId: this.userId,
      adminId: this.adminId,
      date: this.today,
    });

    if (!doc) {
      const newDoc = new DailyAction({
        userId: this.userId,
        adminId: this.adminId,
        date: this.today,
      });

      // Apply increments/decrements safely
      for (const field in this.updateOps) {
        const newValue = (newDoc[field] || 0) + this.updateOps[field];
        newDoc[field] = Math.max(0, newValue);
      }

      newDoc.updatedAt = new Date();
      return await newDoc.save();
    }

    // Existing doc → update safely
    for (const field in this.updateOps) {
      const newValue = (doc[field] || 0) + this.updateOps[field];
      doc[field] = Math.max(0, newValue); // prevent negative
    }

    doc.updatedAt = new Date();
    return await doc.save();
  }
}

// Usage Example:
// const updater = new DailyActionUpdater(userId, adminId);
// await updater .increment('clicks', 5).decrement('orders', 1).setIf('earnings', 100, hasEarnings).apply();
// ==============================
// await new DailyActionUpdater(userId, adminId)
//   .increment("clicks")
//   .apply();
// ==============================
// await new DailyActionUpdater(userId, adminId)
//   .decrement("activeCampaigns", 1)
//   .apply();
// ==============================
// await new DailyActionUpdater(userId, adminId)
//   .increment("earnings", withdrawalAmount)
//   .increment("paidCommission", withdrawalAmount)
//   .apply();
// ==============================
// await new DailyActionUpdater(userId, adminId)
//   .decrement("activeCampaigns", 1)
//   .apply();
// ==============================

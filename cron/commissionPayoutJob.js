import cron from "node-cron";

import mongoose from "mongoose";
import { Campaign } from "../models/campaignSchema.js";
import AffUser from "../models/aff-user.js";

// Run every day at midnight (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running commission payout job...");

  try {
    // Find all campaigns with pending commissions
    const campaigns = await Campaign.find({
      "commissionRecords.status": "PENDING",
    });

    for (const campaign of campaigns) {
      const { userId, returnPeriod, commissionRecords } = campaign;

      // Load the user
      const user = await AffUser.findById(userId);
      if (!user) continue;

      let hasChanges = false;

      for (const record of commissionRecords) {
        if (record.status !== "PENDING") continue;

        const createdDate = new Date(record.createdAt);
        const now = new Date();
        const diffDays = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // If return period has passed
        if (diffDays >= returnPeriod) {
          record.status = "PAID";
          user.payouts.totalAmount += record.finalCommission;
          user.payouts.paidAmount += record.finalCommission;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await campaign.save();
        await user.save();
        console.log(`✅ Updated commissions for user ${user._id}`);
      }
    }
  } catch (err) {
    console.error("❌ Error in payout job:", err.message);
  }
});

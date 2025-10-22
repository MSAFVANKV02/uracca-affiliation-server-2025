import cron from "node-cron";
import { Campaign } from "../models/campaignSchema.js";
import AffUser from "../models/aff-user.js";
import { Commissions } from "../models/commissionSchema.js";

cron.schedule("0 0 * * *", async () => {
  console.log("🔄 Running commission payout job...");

  try {
    // Fetch all pending commission records
    const pendingRecords = await Commissions.find({ status: "PENDING" })
      .populate("campaignId") // to update campaign summary
      .populate("adminId");   // if needed

    let totalUpdated = 0;

    for (const record of pendingRecords) {
      const campaign = record.campaignId;
      if (!campaign) continue;

      const user = await AffUser.findById(campaign.userId);
      if (!user) continue;

      const createdDate = new Date(record.createdAt);
      const now = new Date();

      const diffDays = Math.floor(
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const returnPeriod = campaign.returnPeriod && campaign.returnPeriod > 0 ? campaign.returnPeriod : 1;

      // ✅ Wait one extra day after return period ends
      if (diffDays >= returnPeriod + 1) {
        // Mark commission as paid
        record.status = "PAID";
        const amt = record.finalCommission;
        await record.save();

        // Update user stats
        user.payouts.totalAmount += amt;
        user.payouts.paidAmount += amt;
        user.commissionDetails.pendingCommission -= amt;
        user.commissionDetails.paidCommission += amt;
        await user.save();

        // Update campaign stats
        campaign.commissionDetails.pendingCommission -= amt;
        campaign.commissionDetails.paidCommission += amt;
        await campaign.save();

        totalUpdated++;
        console.log(`✅ Paid ${amt} to user ${user._id} for record ${record._id}`);
      }
    }

    console.log(`🎉 Commission payout job completed. ${totalUpdated} records updated.`);
  } catch (err) {
    console.error("❌ Error in payout job:", err);
  }
});

// cron.schedule("0 0 * * *", async () => {
//   console.log("🔄 Running commission payout job...");

//   try {
//     const campaigns = await Campaign.find({
//       "commissionRecords.status": "PENDING",
//     });

//     let totalUpdated = 0;

//     for (const campaign of campaigns) {
//       const { userId, returnPeriod = 1, commissionRecords } = campaign;

//       const user = await AffUser.findById(userId);
//       if (!user) continue;

//       let hasChanges = false;
//       let paidNow = 0;

//       for (const record of commissionRecords) {
//         if (record.status !== "PENDING") continue;

//         const createdDate = new Date(record.createdAt);
//         const now = new Date();

//         // 🧮 Calculate number of full days since record creation
//         const diffDays = Math.floor(
//           (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
//         );

//         // 🧩 Handle returnPeriod: if 0 or missing, assume 1
//         const effectiveReturnPeriod =
//           returnPeriod && returnPeriod > 0 ? returnPeriod : 1;

//         // ✅ Wait one extra day after return period ends
//         if (diffDays >= effectiveReturnPeriod + 1) {
//           record.status = "PAID";
//           const amt = record.finalCommission;

//           user.payouts.totalAmount += amt;
//           user.payouts.paidAmount += amt;

//           // keep details consistent
//           user.commissionDetails.pendingCommission -= amt;
//           user.commissionDetails.paidCommission += amt;

//           campaign.commissionDetails.pendingCommission -= amt;
//           campaign.commissionDetails.paidCommission += amt;

//           hasChanges = true;
//           paidNow++;
//         }
//       }

//       if (hasChanges) {
//         await campaign.save();
//         await user.save();
//         totalUpdated += paidNow;
//         console.log(`✅ Updated ${paidNow} records for user ${user._id}`);
//       }
//     }

//     console.log(`🎉 Commission payout job completed. ${totalUpdated} records updated.`);
//   } catch (err) {
//     console.error("❌ Error in payout job:", err.message);
//   }
// });

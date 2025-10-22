import AffUser from "../../models/aff-user.js";
import { Campaign } from "../../models/campaignSchema.js";
import { Commissions } from "../../models/commissionSchema.js";
import { Platform } from "../../models/platformSchema.js";
import { Product } from "../../models/productSchema.js";

export const trackAffiliateClick = async (req, res) => {
  try {
    const { referralId, campaignAccessKey } = req.body;

    // --- 1️⃣ Validate input ---
    if (!referralId || !campaignAccessKey) {
      return res.status(400).json({ message: "Missing affiliate parameters" });
    }

    // --- 2️⃣ Find the affiliate user ---
    const user = await AffUser.findOne({ referralId });
    if (!user) {
      return res.status(404).json({ message: "Affiliate user not found" });
    }

    // --- 3️⃣ Check if campaignAccessKey exists in user's schema ---
    const hasAccessKey =
      Array.isArray(user.campaignAccessKey) &&
      user.campaignAccessKey.includes(campaignAccessKey);

    if (!hasAccessKey) {
      return res
        .status(403)
        .json({ message: "This campaign key does not belong to the user" });
    }

    // --- 4️⃣ Find the campaign ---
    const campaign = await Campaign.findOne({
      campaignAccessKey,
      userId: user._id,
    });

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // --- 5️⃣ Increment campaign click count ---
    campaign.clicks = (campaign.clicks || 0) + 1;
    await campaign.save();

    // --- 6️⃣ Increment total user clicks ---
    user.actions.totalClicks = (user.actions.totalClicks || 0) + 1;
    await user.save();

    // --- 7️⃣ Return success response ---
    return res.status(200).json({
      success: true,
      message: "Affiliate click tracked successfully",
      campaignClicks: campaign.clicks,
      totalUserClicks: user.actions.totalClicks,
    });
  } catch (error) {
    console.error("Affiliate tracking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// <---------------------------   purchase order through a platform and take order commission to affiliate user --------------------------->
// ============== ============== ============== ============== ============== ============== ============== ============== ============== ==============

// ==================== purchaseOrderWithAffiliateCampaign ====================



export const purchaseOrderWithAffiliateCampaign = async (req, res) => {
  try {
    const { referralId, campaignAccessKey, productId, orderId, orderAmount } = req.body;

    // 1️⃣ Basic validation
    if (!referralId || !campaignAccessKey || !orderId || !orderAmount) {
      return res.status(400).json({
        message: "Missing required parameters (referralId, campaignAccessKey, orderId, orderAmount)",
      });
    }

    // 2️⃣ Find affiliate user
    const user = await AffUser.findOne({ referralId });
    if (!user) return res.status(404).json({ message: "Affiliate user not found" });

    // 3️⃣ Validate campaignAccessKey
    const validKey = Array.isArray(user.campaignAccessKey) && user.campaignAccessKey.includes(campaignAccessKey);
    if (!validKey) return res.status(403).json({ message: "Invalid campaign key for this user" });

    // 4️⃣ Find campaign
    const campaign = await Campaign.findOne({ campaignAccessKey, userId: user._id });
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // ✅ Check product eligibility based on commissionType
    if (user?.affType?.commissionType === "ONLY_AFF_PRODUCT" &&
        (!campaign.product?.productId || campaign.product.productId.toString() !== productId)) {
      return res.status(400).json({ message: "This product is not part of the current campaign" });
    }

    // ----------------------------------------------------------------
    // 🧩 Step A: Determine Commission Percentage
    // ----------------------------------------------------------------
    let commissionPercent = 0;
    if (user?.affType?.commission) {
      commissionPercent = user.affType.commission;
    } else if (productId) {
      const product = await Product.findById(productId);
      if (product?.commission) {
        commissionPercent = product.commission;
      } else {
        const platform = await Platform.findOne({ adminId: campaign.company.accountId });
        commissionPercent = platform?.commission ?? 0;
      }
    } else {
      const platform = await Platform.findOne({ adminId: campaign.company.accountId });
      commissionPercent = platform?.commission ?? 0;
    }

    const commissionAmount = (orderAmount * commissionPercent) / 100;

    // ----------------------------------------------------------------
    // 🧩 Step B: Calculate TDS
    // ----------------------------------------------------------------
    const platform = await Platform.findOne({ adminId: campaign.company.accountId });
    if (!platform) return res.status(404).json({ message: "Platform not found for admin" });

    const tdsType = user?.affType?.tdsType || "LINKED";
    let tdsAmount = 0;
    if (tdsType === "LINKED") {
      tdsAmount = platform.tdsLinkedMethods.type === "PERCENT"
        ? (commissionAmount * (platform.tdsLinkedMethods.amount || 0)) / 100
        : platform.tdsLinkedMethods.amount || 0;
    } else {
      tdsAmount = platform.tdsUnLinkedMethods.type === "PERCENT"
        ? (commissionAmount * (platform.tdsUnLinkedMethods.amount || 0)) / 100
        : platform.tdsUnLinkedMethods.amount || 0;
    }

    const finalCommission = commissionAmount - tdsAmount;

    // ----------------------------------------------------------------
    // 🧩 Step C: Save commission as separate document
    // ----------------------------------------------------------------
    const commissionRecord = await Commissions.create({
      orderId,
      adminId: campaign.company.accountId,
      userId: user._id,
      campaignId: campaign._id,
      commissionAmount,
      purchaseAmount: orderAmount,
      tdsAmount,
      finalCommission,
      status: "PENDING",
      createdAt: new Date(),
    });

    // update campaign commission summary
    campaign.commissionDetails.totalCommission += commissionAmount;
    campaign.commissionDetails.pendingCommission += finalCommission;
    campaign.commissionDetails.totalTdsCutOff += tdsAmount;
    campaign.ordersCount += 1;
    await campaign.save();

    // ----------------------------------------------------------------
    // 🧩 Step D: Update user statistics
    // ----------------------------------------------------------------
    user.actions.totalOrders += 1;
    user.commissionDetails.totalCommission += commissionAmount;
    user.commissionDetails.pendingCommission += finalCommission;
    user.commissionDetails.totalTdsCutOff += tdsAmount;
    await user.save();

    // ----------------------------------------------------------------
    // ✅ Step E: Response
    // ----------------------------------------------------------------
    return res.status(200).json({
      message: "Commission recorded successfully",
      data: { commissionAmount, tdsAmount, finalCommission, commissionPercent },
    });
  } catch (error) {
    console.error("❌ Error in purchaseOrderWithAffiliateCampaign:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


// export const purchaseOrderWithAffiliateCampaign = async (req, res) => {
//   try {
//     console.log("enter");

//     const { referralId, campaignAccessKey, productId, orderId, orderAmount } =
//       req.body;

//     // console.log(req.body);

//     // 1️⃣ Basic validation
//     if (!referralId || !campaignAccessKey || !orderId || !orderAmount) {
//       return res
//         .status(400)
//         .json({
//           message:
//             "Missing required parameters (referralId, campaignAccessKey, orderId, orderAmount)",
//         });
//     }

//     // 2️⃣ Find affiliate user
//     const user = await AffUser.findOne({ referralId });
//     if (!user)
//       return res.status(404).json({ message: "Affiliate user not found" });

//     // 3️⃣ Validate campaignAccessKey belongs to user
//     const validKey =
//       Array.isArray(user.campaignAccessKey) &&
//       user.campaignAccessKey.includes(campaignAccessKey);

//     if (!validKey)
//       return res
//         .status(403)
//         .json({ message: "Invalid campaign key for this user" });

//     // 4️⃣ Find campaign
//     const campaign = await Campaign.findOne({
//       campaignAccessKey,
//       userId: user._id,
//     });
//     if (!campaign)
//       return res.status(404).json({ message: "Campaign not found" });

//     // ✅ Check if productId belongs to this campaign
//     // ✅ Conditional product check based on affiliate type
// if (
//   user?.affType?.commissionType === "ONLY_AFF_PRODUCT" &&
//   (!campaign.product?.productId || campaign.product.productId.toString() !== productId)
// ) {
//   return res
//     .status(400)
//     .json({ message: "This product is not part of the current campaign" });
// }

//     // if (
//     //   !campaign.product?.productId ||
//     //   campaign.product.productId.toString() !== productId
//     // ) {
//     //   return res
//     //     .status(400)
//     //     .json({ message: "This product is not part of the current campaign" });
//     // }

//     // ----------------------------------------------------------------
//     // 🧩 Step A: Determine Commission Percentage
//     // ----------------------------------------------------------------
//     let commissionPercent = 0;

//     // (1) From affiliate type schema if available
//     if (user?.affType?.commission) {
//       commissionPercent = user.affType.commission;
//     } else if (productId) {
//       // (2) From product schema if exists
//       const product = await Product.findById(productId);
//       if (product?.commission) {
//         commissionPercent = product.commission;
//       } else {
//         // (3) From platform if not found
//         const platform = await Platform.findOne({
//           adminId: campaign.company.accountId,
//         });
//         commissionPercent = platform?.commission ?? 0;
//       }
//     } else {
//       // fallback
//       const platform = await Platform.findOne({
//         adminId: campaign.company.accountId,
//       });
//       commissionPercent = platform?.commission ?? 0;
//     }

//     // Commission should always be percentage
//     const commissionAmount = (orderAmount * commissionPercent) / 100;

//     // ----------------------------------------------------------------
//     // 🧩 Step B: Determine TDS deduction
//     // ----------------------------------------------------------------
//     const platform = await Platform.findOne({
//       adminId: campaign.company.accountId,
//     });
//     if (!platform)
//       return res.status(404).json({ message: "Platform not found for admin" });

//     // Get TDS type from affiliate user
//     const tdsType = user?.affType?.tdsType || "LINKED";
//     let tdsAmount = 0;

//     if (tdsType === "LINKED") {
//       if (platform.tdsLinkedMethods.type === "PERCENT") {
//         tdsAmount =
//           (commissionAmount * (platform.tdsLinkedMethods.amount || 0)) / 100;
//       } else {
//         tdsAmount = platform.tdsLinkedMethods.amount || 0;
//       }
//     } else {
//       if (platform.tdsUnLinkedMethods.type === "PERCENT") {
//         tdsAmount =
//           (commissionAmount * (platform.tdsUnLinkedMethods.amount || 0)) / 100;
//       } else {
//         tdsAmount = platform.tdsUnLinkedMethods.amount || 0;
//       }
//     }

//     // Final commission after TDS
//     const finalCommission = commissionAmount - tdsAmount;

//     // ----------------------------------------------------------------
//     // 🧩 Step C: Save commission record inside campaign
//     // ----------------------------------------------------------------
//     const commissionRecord = {
//       orderId,
//       commissionAmount,
//       purchaseAmount: orderAmount,
//       tdsAmount,
//       finalCommission,
//       status: "PENDING",
//       createdAt: new Date(),
//     };

//     campaign.commissionRecords.push(commissionRecord);

//     // update campaign commission summary
//     campaign.commissionDetails.totalCommission += commissionAmount;
//     campaign.commissionDetails.pendingCommission += finalCommission;
//     campaign.commissionDetails.totalTdsCutOff += tdsAmount;
//     campaign.ordersCount += 1;

//     await campaign.save();

//     // ----------------------------------------------------------------
//     // 🧩 Step D: Update user’s statistics
//     // ----------------------------------------------------------------
//     user.actions.totalOrders += 1;
//     user.commissionDetails.totalCommission += commissionAmount;
//     user.commissionDetails.pendingCommission += finalCommission;
//     user.commissionDetails.totalTdsCutOff += tdsAmount;
//     await user.save();

//     // ----------------------------------------------------------------
//     // ✅ Step E: Response
//     // ----------------------------------------------------------------
//     return res.status(200).json({
//       message: "Commission recorded successfully",
//       data: {
//         commissionAmount,
//         tdsAmount,
//         finalCommission,
//         commissionPercent,
//       },
//     });
//   } catch (error) {
//     console.error("❌ Error in purchaseOrderWithAffiliateCampaign:", error);
//     return res.status(500).json({
//       message: "Internal Server Error",
//       error: error.message,
//     });
//   }
// };

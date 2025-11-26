import AffUser from "../../models/aff-user.js";
import { Campaign } from "../../models/campaignSchema.js";
import { Commissions } from "../../models/commissionSchema.js";
import { Platform } from "../../models/platformSchema.js";
import { Product } from "../../models/productSchema.js";
import { getAndValidatePlatformProducts } from "../../utils/platformProductUtils.js";
import { DailyActionUpdater } from "../../utils/recordAction.js";
import { CalculateTDS } from "./calculateTDS.js";

export const trackAffiliateClick = async (req, res, next) => {
  // console.log("inside trackAffiliateClick");

  try {
    const { referralId, campaignAccessKey } = req.body;

    // --- 1️⃣ Validate input ---
    if (!referralId || !campaignAccessKey) {
      // return res.status(400).json({ message: "Missing affiliate parameters" });
      throw new Error("Missing affiliate parameters");
    }

    // --- 2️⃣ Find the affiliate user ---
    const user = await AffUser.findOne({ referralId });
    if (!user) {
      // return res.status(404).json({ message: "Affiliate user not found" });
      throw new Error("Affiliate user not found");
    }

    // --- 3️⃣ Check if campaignAccessKey exists in user's schema ---
    const hasAccessKey =
      Array.isArray(user.campaignAccessKey) &&
      user.campaignAccessKey.includes(campaignAccessKey);

    if (!hasAccessKey) {
      // return res
      //   .status(403)
      //   .json({ message: "This campaign key does not belong to the user" });
      throw new Error("This campaign key does not belong to the user");
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

    // --- 7️⃣ Add click to DailyAction Schema ---
    // await RecordAction(user._id, { clicks: 1 });
    await new DailyActionUpdater(user._id, user.workingOn)
      .increment("clicks")
      .apply();

    // --- 8️⃣ Response ---
    return res.status(200).json({
      success: true,
      message: "Affiliate click tracked successfully",
      campaignClicks: campaign.clicks,
      totalUserClicks: user.actions.totalClicks,
    });
  } catch (error) {
    // console.error("Affiliate tracking error:", error);
    // return res.status(500).json({ message: "Internal server error" });
    next(error);
  }
};

// <---------------------------   purchase order through a platform and take order commission to affiliate user --------------------------->
// ============== ============== ============== ============== ============== ============== ============== ============== ============== ==============

// ==================== purchaseOrderWithAffiliateCampaign ====================

export const purchaseOrderWithAffiliateCampaign = async (req, res, next) => {
  console.log("inside purchaseOrderWithAffiliateCampaign");
  try {
    const {
      referralId,
      campaignAccessKey,
      productDetails = [],
      orderId,
    } = req.body;
    // console.log(req.body, "req.body");

    // 1️⃣ Basic validation
    if (
      !referralId ||
      !campaignAccessKey ||
      !orderId ||
      !productDetails.length
    ) {
      // return res.status(400).json({
      //   message:
      //     "Missing required parameters (referralId, campaignAccessKey, orderId, productDetails)",
      // });
      throw new Error(
        "Missing required parameters (referralId, campaignAccessKey, orderId, productDetails)"
      );
    }

    // 2️⃣ Find affiliate user
    const user = await AffUser.findOne({ referralId });
    if (!user)
      return res.status(404).json({ message: "Affiliate user not found" });

    // 3️⃣ Validate campaignAccessKey
    const validKey =
      Array.isArray(user.campaignAccessKey) &&
      user.campaignAccessKey.includes(campaignAccessKey);
    if (!validKey)
      return res
        .status(403)
        .json({ message: "Invalid campaign key for this user" });

    // 4️⃣ Find campaign
    const campaign = await Campaign.findOne({
      campaignAccessKey,
      userId: user._id,
    });
    if (!campaign) {
      //  return res.status(404).json({ message: "Campaign not found" });
      throw new Error("Campaign not found");
    }

    // 5️⃣ Get platform info for that campaign admin
    const platform = await Platform.findOne({
      adminId: campaign.company.accountId,
    });
    if (!platform) {
      // return res.status(404).json({ message: "Platform not found for admin" });
      throw new Error("Platform not found for admin");
    }

    // ----------------------------------------------------------------
    // 🧩 Step A: Fetch and validate platform products
    // ----------------------------------------------------------------
    const { validProducts, blockedProducts, totalValidAmount } =
      await getAndValidatePlatformProducts(
        platform.backendRoutes.products,
        productDetails,
        platform.domain
      );

    if (validProducts.length === 0) {
      // return res.status(400).json({
      //   message: "No valid active products found for this order",
      //   blockedProducts,
      // });
      throw new Error("No valid active products found for this order");
    }

    // ----------------------------------------------------------------
    // 🧩 Step B: Commission eligibility logic
    // ----------------------------------------------------------------
    const campaignProductId = campaign.product?.productId?.toString();
    let eligibleCount = 0;
    // console.log(campaignProductId,'campaignProductId');
    // console.log(validProducts,'validProducts');

    if (user?.affType?.commissionType === "ONLY_AFF_PRODUCT") {
      const matched = validProducts.some(
        (p) => p.productId?.toString() === campaignProductId
      );
      if (!matched) {
        // return res.status(400).json({
        //   message: "This product is not part of the current campaign",
        // });
        throw new Error("This product is not part of the current campaign");
      }
      eligibleCount = 1;
    } else if (user?.affType?.commissionType === "ALL_PRODUCT") {
      const matched = validProducts.some(
        (p) => p.productId?.toString() === campaignProductId
      );
      if (!matched) {
        // return res.status(400).json({
        //   message: "No matching campaign product found among purchased items",
        // });
        throw new Error(
          "No matching campaign product found among purchased items"
        );
      }
      eligibleCount = validProducts.length;
    } else {
      eligibleCount = 1;
    }

    // ----------------------------------------------------------------
    // 🧩 Step C: Determine Commission %
    // ----------------------------------------------------------------
    let commissionPercent = 0;
    // console.log(commissionPercent,'commissionPercent');
    

    if (user?.affType?.commission > 0) {
      commissionPercent = user.affType.commission;
    } else {
      for (const product of validProducts) {
        if (product?.commission > 0) {
          commissionPercent = product.commission;
          break;
        }
      }

      if (commissionPercent === 0) {
        commissionPercent = platform.commission ?? 0;
      }
    }

    if (commissionPercent <= 0) {
      // return res
      //   .status(400)
      //   .json({ message: "No commission defined for this order" });
      throw new Error("No commission defined for this order");
    }

    // 🧮 Commission based on total valid product amount
    const commissionAmount = (totalValidAmount * commissionPercent) / 100;
    // console.log(totalValidAmount,'totalValidAmount');

    // console.log(commissionAmount,'commissionAmount');

    // ----------------------------------------------------------------
    // 🧩 Step D: Calculate TDS
    // ----------------------------------------------------------------
    // const tdsType = user?.affType?.tdsType || "LINKED";
    // const tdsBase =
    //   tdsType === "LINKED"
    //     ? platform.tdsLinkedMethods
    //     : platform.tdsUnLinkedMethods;

    // const tdsAmount =
    //   tdsBase.type === "PERCENT"
    //     ? (commissionAmount * (tdsBase.amount || 0)) / 100
    //     : tdsBase.amount || 0;

    // const finalCommission = commissionAmount - tdsAmount;
    // ----------------------------------------------------------------
    // 🧩 Step D: Calculate TDS (Reusable Function)
    // ----------------------------------------------------------------
    const tdsType = user?.affType?.tdsType || "LINKED";
    const isTdsEnabled = user?.affType?.isTdsEnabled ?? false;

    const { tdsAmount, finalCommission } = CalculateTDS(
      commissionAmount,
      tdsType,
      platform,
      isTdsEnabled
    );

    // ----------------------------------------------------------------
    // 🧩 Step E: Save commission record
    // ----------------------------------------------------------------
    const commissionRecord = await Commissions.create({
      orderId,
      adminId: campaign.company.accountId,
      userId: user._id,
      campaignId: campaign._id,
      commissionAmount,
      purchaseAmount: totalValidAmount,
      tdsAmount,
      finalCommission,
      status: "PENDING",
      createdAt: new Date(),
      productIds: validProducts.map((p) => p.productId),
    });

    // Update campaign stats
    campaign.commissionDetails.totalCommission += commissionAmount;
    campaign.commissionDetails.pendingCommission += finalCommission;
    campaign.commissionDetails.totalTdsCutOff += tdsAmount;
    campaign.commissionRecords.push(commissionRecord._id);
    campaign.commissionDetails.totalCommissionWithTds += finalCommission;
    campaign.ordersCount += 1;
    await campaign.save();

    // Update user stats
    user.actions.totalOrders += 1;
    user.commissionDetails.totalCommission += commissionAmount;
    user.commissionDetails.pendingCommission += finalCommission;
    user.commissionDetails.totalTdsCutOff += tdsAmount;
    user.commissionDetails.totalCommissionWithTds += finalCommission;
    await user.save();

    // --- 7️⃣ Add click to DailyAction Schema ---
    // await RecordAction(user._id, { orders: 1 });
    await new DailyActionUpdater(user._id, user.workingOn)
      .increment("orders")
      .apply();

    // ✅ Response
    return res.status(200).json({
      message: "Commission recorded successfully",
      data: {
        totalValidAmount,
        commissionAmount,
        tdsAmount,
        finalCommission,
        commissionPercent,
        eligibleCount,
        validProducts: validProducts.map((p) => ({
          productId: p.productId,
          productAmount: p.productAmount,
          commission: p.commission,
        })),
        blockedProducts,
      },
    });
  } catch (error) {
    console.error("❌ Error in purchaseOrderWithAffiliateCampaign:", error);
    next(error);
    // return res.status(500).json({
    //   message: "Internal Server Error",
    //   error: error.message,
    // });
  }
};

// export const purchaseOrderWithAffiliateCampaign = async (req, res) => {
//   try {
//     const { referralId, campaignAccessKey, productDetails = [], orderId, orderAmount } = req.body;
//     // productDetails = {productId,productAmount}
//     console.log("===== productId",productId,"========");
//     // 1️⃣ Basic validation
//     if (!referralId || !campaignAccessKey || !orderId || !orderAmount) {
//       return res.status(400).json({
//         message: "Missing required parameters (referralId, campaignAccessKey, orderId, orderAmount)",
//       });
//     }

//     // 2️⃣ Find affiliate user
//     const user = await AffUser.findOne({ referralId });
//     if (!user) return res.status(404).json({ message: "Affiliate user not found" });

//     // 3️⃣ Validate campaignAccessKey
//     const validKey =
//       Array.isArray(user.campaignAccessKey) && user.campaignAccessKey.includes(campaignAccessKey);
//     if (!validKey) return res.status(403).json({ message: "Invalid campaign key for this user" });

//     // 4️⃣ Find campaign
//     const campaign = await Campaign.findOne({ campaignAccessKey, userId: user._id });
//     if (!campaign) return res.status(404).json({ message: "Campaign not found" });

//     // 5️⃣ Get platform info for that campaign admin
//     const platform = await Platform.findOne({ adminId: campaign.company.accountId });
//     if (!platform) return res.status(404).json({ message: "Platform not found for admin" });

//     // ✅ Normalize productId as array
//     const productIdsArray = Array.isArray(productId)
//       ? productId
//       : typeof productId === "string"
//       ? [productId]
//       : [];

//     // ----------------------------------------------------------------
//     // 🧩 Step A: Fetch and validate platform products
//     // ----------------------------------------------------------------
//     const { validProducts, blockedProducts } = await getAndValidatePlatformProducts(
//       platform.backendRoutes.products,
//       productIdsArray,
//       platform.domain
//     );

//     // 🚫 No valid products
//     if (validProducts.length === 0) {
//       return res.status(400).json({
//         message: "No valid active products found in platform backend",
//         blockedProducts,
//       });
//     }

//     console.log("===== validProducts",validProducts,"========");

//     // ----------------------------------------------------------------
//     // 🧩 Step B: Commission eligibility logic
//     // ----------------------------------------------------------------
//     const campaignProductId = campaign.product?.productId?.toString();
//     let eligibleCount = 0;

//     if (user?.affType?.commissionType === "ONLY_AFF_PRODUCT") {
//       const matched = validProducts.some(
//         (p) => p.productId?.toString() === campaignProductId
//       );
//       if (!matched) {
//         return res.status(400).json({
//           message: "This product is not part of the current campaign",
//         });
//       }
//       eligibleCount = 1;
//     } else if (user?.affType?.commissionType === "ALL_PRODUCT") {
//       const matched = validProducts.some(
//         (p) => p.productId?.toString() === campaignProductId
//       );
//       if (!matched) {
//         return res.status(400).json({
//           message: "No matching campaign product found among purchased items",
//         });
//       }
//       eligibleCount = validProducts.length;
//     } else {
//       eligibleCount = 1;
//     }

//     // ----------------------------------------------------------------
//     // 🧩 Step C: Determine Commission %
//     // ----------------------------------------------------------------
//     let commissionPercent = 0;

//     if (user?.affType?.commission > 0) {
//       commissionPercent = user.affType.commission;
//     } else {
//       for (const product of validProducts) {
//         if (product?.commission > 0) {
//           commissionPercent = product.commission;
//           break;
//         }
//       }

//       if (commissionPercent === 0) {
//         if (!platform || (platform.commission ?? 0) <= 0) {
//           return res.status(400).json({ message: "No commission defined for this order" });
//         }
//         commissionPercent = platform.commission;
//       }
//     }

//     // 🧮 Commission × eligibleCount
//     const commissionAmount = ((orderAmount * commissionPercent) / 100) * eligibleCount;

//     // ----------------------------------------------------------------
//     // 🧩 Step D: Calculate TDS
//     // ----------------------------------------------------------------
//     const tdsType = user?.affType?.tdsType || "LINKED";
//     let tdsAmount = 0;

//     if (tdsType === "LINKED") {
//       tdsAmount =
//         platform.tdsLinkedMethods.type === "PERCENT"
//           ? (commissionAmount * (platform.tdsLinkedMethods.amount || 0)) / 100
//           : platform.tdsLinkedMethods.amount || 0;
//     } else {
//       tdsAmount =
//         platform.tdsUnLinkedMethods.type === "PERCENT"
//           ? (commissionAmount * (platform.tdsUnLinkedMethods.amount || 0)) / 100
//           : platform.tdsUnLinkedMethods.amount || 0;
//     }

//     const finalCommission = commissionAmount - tdsAmount;

//     // ----------------------------------------------------------------
//     // 🧩 Step E: Save commission
//     // ----------------------------------------------------------------
//     const commissionRecord = await Commissions.create({
//       orderId,
//       adminId: campaign.company.accountId,
//       userId: user._id,
//       campaignId: campaign._id,
//       commissionAmount,
//       purchaseAmount: orderAmount,
//       tdsAmount,
//       finalCommission,
//       status: "PENDING",
//       createdAt: new Date(),
//       productIds: validProducts.map((p) => p.productId),
//     });

//     // Update campaign stats
//     campaign.commissionDetails.totalCommission += commissionAmount;
//     campaign.commissionDetails.pendingCommission += finalCommission;
//     campaign.commissionDetails.totalTdsCutOff += tdsAmount;
//     campaign.commissionRecords.push(commissionRecord._id);
//     campaign.commissionDetails.totalCommissionWithTds += finalCommission;
//     campaign.ordersCount += 1;
//     await campaign.save();

//     // Update user stats
//     user.actions.totalOrders += 1;
//     user.commissionDetails.totalCommission += commissionAmount;
//     user.commissionDetails.pendingCommission += finalCommission;
//     user.commissionDetails.totalTdsCutOff += tdsAmount;
//     user.commissionDetails.totalCommissionWithTds += finalCommission;
//     await user.save();

//     // ✅ Response
//     return res.status(200).json({
//       message: "Commission recorded successfully",
//       data: {
//         commissionAmount,
//         tdsAmount,
//         finalCommission,
//         commissionPercent,
//         eligibleCount,
//         validProducts: validProducts.map((p) => ({
//           productId: p.productId,
//           productName: p.productName,
//           commission: p.commission,
//         })),
//         blockedProducts,
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

// export const purchaseOrderWithAffiliateCampaign = async (req, res) => {
//   try {
//     const { referralId, campaignAccessKey, productId, orderId, orderAmount } = req.body;

//     // 1️⃣ Basic validation
//     if (!referralId || !campaignAccessKey || !orderId || !orderAmount) {
//       return res.status(400).json({
//         message: "Missing required parameters (referralId, campaignAccessKey, orderId, orderAmount)",
//       });
//     }

//     // 2️⃣ Find affiliate user
//     const user = await AffUser.findOne({ referralId });
//     if (!user) return res.status(404).json({ message: "Affiliate user not found" });

//     // 3️⃣ Validate campaignAccessKey
//     const validKey = Array.isArray(user.campaignAccessKey) && user.campaignAccessKey.includes(campaignAccessKey);
//     if (!validKey) return res.status(403).json({ message: "Invalid campaign key for this user" });

//     // 4️⃣ Find campaign
//     const campaign = await Campaign.findOne({ campaignAccessKey, userId: user._id });
//     if (!campaign) return res.status(404).json({ message: "Campaign not found" });

//     // ✅ Check product eligibility based on commissionType
//     if (user?.affType?.commissionType === "ONLY_AFF_PRODUCT" &&
//         (!campaign.product?.productId || campaign.product.productId.toString() !== productId)) {
//       return res.status(400).json({ message: "This product is not part of the current campaign" });
//     }

//     // ----------------------------------------------------------------
//     // 🧩 Step A: Determine Commission Percentage
//     // ----------------------------------------------------------------
//     let commissionPercent = 0;
//     if (user?.affType?.commission > 0) {
//       commissionPercent = user.affType.commission;
//     } else if (productId) {
//       const product = await Product.findById(productId);
//       if (product?.commission > 0) {
//         commissionPercent = product.commission;
//       } else {
//         const platform = await Platform.findOne({ adminId: campaign.company.accountId });
//         if (!platform || (platform.commission ?? 0) <= 0) {
//           return res.status(400).json({ message: "No commission defined for this order" });
//         }
//         commissionPercent = platform?.commission ?? 0;
//       }
//     } else {
//       const platform = await Platform.findOne({ adminId: campaign.company.accountId });
//       if (!platform || (platform.commission ?? 0) <= 0) {
//         return res.status(400).json({ message: "No commission defined for this order" });
//       }
//       commissionPercent = platform?.commission ?? 0;
//     }

//     const commissionAmount = (orderAmount * commissionPercent) / 100;

//     console.log(commissionAmount, "commissionAmount");

//     // ----------------------------------------------------------------
//     // 🧩 Step B: Calculate TDS
//     // ----------------------------------------------------------------
//     const platform = await Platform.findOne({ adminId: campaign.company.accountId });
//     if (!platform) return res.status(404).json({ message: "Platform not found for admin" });

//     const tdsType = user?.affType?.tdsType || "LINKED";
//     let tdsAmount = 0;
//     if (tdsType === "LINKED") {
//       tdsAmount = platform.tdsLinkedMethods.type === "PERCENT"
//         ? (commissionAmount * (platform.tdsLinkedMethods.amount || 0)) / 100
//         : platform.tdsLinkedMethods.amount || 0;
//     } else {
//       tdsAmount = platform.tdsUnLinkedMethods.type === "PERCENT"
//         ? (commissionAmount * (platform.tdsUnLinkedMethods.amount || 0)) / 100
//         : platform.tdsUnLinkedMethods.amount || 0;
//     }
//     console.log(tdsType, "tdsType");

//     const finalCommission = commissionAmount - tdsAmount;
//     console.log(finalCommission, "finalCommission");

//     // ----------------------------------------------------------------
//     // 🧩 Step C: Save commission as separate document
//     // ----------------------------------------------------------------
//     const commissionRecord = await Commissions.create({
//       orderId,
//       adminId: campaign.company.accountId,
//       userId: user._id,
//       campaignId: campaign._id,
//       commissionAmount,
//       purchaseAmount: orderAmount,
//       tdsAmount,
//       finalCommission,
//       status: "PENDING",
//       createdAt: new Date(),
//     });

//     // update campaign commission summary
//     campaign.commissionDetails.totalCommission += commissionAmount;
//     campaign.commissionDetails.pendingCommission += finalCommission;
//     campaign.commissionDetails.totalTdsCutOff += tdsAmount;
//     campaign.commissionRecords.push(commissionRecord._id);
//     campaign.commissionDetails.totalCommissionWithTds += finalCommission;
//     campaign.ordersCount += 1;
//     await campaign.save();

//     // ----------------------------------------------------------------
//     // 🧩 Step D: Update user statistics
//     // ----------------------------------------------------------------
//     user.actions.totalOrders += 1;
//     user.commissionDetails.totalCommission += commissionAmount;
//     user.commissionDetails.pendingCommission += finalCommission;
//     user.commissionDetails.totalTdsCutOff += tdsAmount;
//     user.commissionDetails.totalCommissionWithTds += finalCommission;

//     await user.save();

//     // ----------------------------------------------------------------
//     // ✅ Step E: Response
//     // ----------------------------------------------------------------
//     return res.status(200).json({
//       message: "Commission recorded successfully",
//       data: { commissionAmount, tdsAmount, finalCommission, commissionPercent },
//     });
//   } catch (error) {
//     console.error("❌ Error in purchaseOrderWithAffiliateCampaign:", error);
//     return res.status(500).json({ message: "Internal Server Error", error: error.message });
//   }
// };

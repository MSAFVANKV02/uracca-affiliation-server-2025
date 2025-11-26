import AffUser from "../../models/aff-user.js";
import { Campaign } from "../../models/campaignSchema.js";
import { encryptData } from "../../utils/cript-data.js";
import generateUniqueCampaignAccessKey from "../../utils/generate-keys.js";
import { InitAffiliate, TrackClick } from "@haash/affiliate";
import { DailyActionUpdater } from "../../utils/recordAction.js";

export const createCampaign = async (req, res) => {
  try {
    const {
      productId,
      slug,
      domain,
      returnPeriod,
      accountId,
      title,
      image,
      mrp,
      category,
      categoryId,
    } = req.body;
    //   image: String,
    //   title: String,
    //   mrp: String,
    //   category: String,
    if (!productId || !slug || !domain || !accountId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const user = req.user; // ✅ user from middleware
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Generate unique key
    const campaignAccessKey = await generateUniqueCampaignAccessKey();

    // Generate campaign link with user's referral ID
    const campaignLink = `${domain}products/${slug}?aff=${user.referralId}&campKey=${campaignAccessKey}`;

    // Create new campaign
    const newCampaign = new Campaign({
      userId: user._id,
      company: {
        domain,
        accountId, // ✅ passed from body (admin/platform account ID)
      },
      campaignLink,
      returnPeriod,
      campaignAccessKey,
      product: {
        productId,
        title,
        image,
        mrp,
        category,
        categoryId,
      },
    });

    const savedCampaign = await newCampaign.save();

    // Update user with campaign details
    await AffUser.findByIdAndUpdate(
      user._id,
      {
        $addToSet: {
          campaignAccessKey,
          campaignId: savedCampaign._id,
        },
      },
      { new: true }
    );

    // ============ Affiliate daily action ==============
    await new DailyActionUpdater(user._id, user.workingOn)
      .increment("activeCampaigns")
      .apply();
    // ============ Affiliate daily action ==============


    res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: {
        campaignId: savedCampaign._id,
        campaignAccessKey,
        campaignLink,
      },
    });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create campaign",
      error: error.message,
    });
  }
};

//   ==== get users campaigns ===
export const getUserCampaigns = async (req, res, next) => {
  try {
    const user = req.user; // ✅ authenticated user from middleware
    // console.log(user, "user getUserCampaigns");

    if (!user) {
      // return res.status(401).json({ success: false, message: "Unauthorized" });
      throw new Error("Unauthorized");
    }

    // Optional filter: only campaigns for a specific admin/platform
    const { accountId, date, sort } = req.query;
    console.log(req.query, "req.query");

    const query = { userId: user._id };
    if (accountId) {
      query["company.accountId"] = accountId;
    }

    // Default sorting
    let sortQuery = { createdAt: -1 }; // latest

    //   sort with date
    if (date === "newest") {
      sortQuery = { createdAt: -1 }; // newest
    }
    if (date === "oldest") {
      sortQuery = { createdAt: 1 }; // oldest
    }

    // 🔥 Commission sorting
    if (sort === "high") {
      sortQuery = { "commissionDetails.totalCommissionWithTds": -1 };
    }
    if (sort === "low") {
      sortQuery = { "commissionDetails.totalCommissionWithTds": 1 };
    }

    const campaigns = await Campaign.find(query)
      .sort(sortQuery)
      .populate("userId");

    const encryptedData = encryptData(campaigns);

    res.status(200).json({
      success: true,
      message: "User campaigns fetched successfully",
      data: encryptedData,
    });
  } catch (error) {
    // console.error("Error fetching user campaigns:", error);
    // res.status(500).json({
    //   success: false,
    //   message: "Failed to fetch campaigns",
    //   error: error.message,
    // });
    next(error);
  }
};

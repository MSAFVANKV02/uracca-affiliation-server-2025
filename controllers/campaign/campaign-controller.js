import AffUser from "../../models/aff-user.js";
import { Campaign } from "../../models/campaignSchema.js";
import generateUniqueCampaignAccessKey from "../../utils/generate-keys.js";

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
    const campaignLink = `${domain}/products/${slug}?aff=${user.referralId}&campKey=${campaignAccessKey}`;

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
export const getUserCampaigns = async (req, res) => {
  try {
    const user = req.user; // ✅ authenticated user from middleware
    console.log(user, "user req");

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Optional filter: only campaigns for a specific admin/platform
    const { adminAccountId } = req.query;

    const query = { userId: user._id };
    if (adminAccountId) {
      query["company.accountId"] = adminAccountId;
    }

    const campaigns = await Campaign.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User campaigns fetched successfully",
      data: campaigns,
    });
  } catch (error) {
    console.error("Error fetching user campaigns:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch campaigns",
      error: error.message,
    });
  }
};

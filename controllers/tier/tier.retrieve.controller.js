import { Tier } from "../../models/tier-models/tierSystemSchema.js";
import { UserTierProgress } from "../../models/tier-models/tierUserProgressSchema.js";
import { encryptData } from "../../utils/cript-data.js";


// ================================================================ ///
// ================ GET ALL AFFILIATE TIER ========================= ///
// ================================================================ ///


export const getAllAffiliateTiersController = async (req, res, next) => {
  try {
    const admin = req.admin;

    // Fetch all tiers for the admin, sorted by 'order'
    const tiers = await Tier.find({ adminId: admin._id }).sort({ order: 1 });

    const encryptedTier = encryptData(tiers)

    return res.status(200).json({
      success: true,
      message: "Affiliate tiers fetched successfully",
      data: encryptedTier,
    });
  } catch (error) {
    next(error);
  }
};


export const getAllAffiliateTiersWithIdController = async (req, res, next) => {
  try {
    const admin = req.admin;
    const { tierId } = req.params;

    let tiers;

    // ==========================
    // GET SINGLE TIER BY ID
    // ==========================
    if (tierId) {
      const tier = await Tier.findOne({
        _id: tierId,
        adminId: admin._id,
      });

      if (!tier) {
        return res.status(404).json({
          success: false,
          message: "Tier not found",
          data: [],
        });
      }

      tiers = [tier]; // always return array to match frontend structure
    }

    // ==========================
    // GET ALL TIERS
    // ==========================
    else {
      tiers = await Tier.find({ adminId: admin._id }).sort({ order: 1 });
    }

    const encryptedTier = encryptData(tiers);

    return res.status(200).json({
      success: true,
      message: "Affiliate tiers fetched successfully",
      data: encryptedTier,
    });
  } catch (error) {
    next(error);
  }
};


// ================================================================ ///
// ================ GET USER AFFILIATE CURRENT TIER ========================= ///
// ================================================================ ///


export const getUserAffiliateCurrentTierController = async (req, res, next) => {
    try {
        const admin = req.admin;
        const { userId } = req.params;
    
        if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
        }
    
        // Fetch the user's current tier progress
        const userTierProgress = await UserTierProgress.findOne({
        userId,
        adminId: admin._id,
        }).populate("currentTierId");
    
        if (!userTierProgress) {
        return res.status(404).json({ message: "User tier progress not found" });
        }
    
        return res.status(200).json({
        success: true,
        message: "User's current affiliate tier fetched successfully",
        data: userTierProgress.currentTierId,
        });
    } catch (error) {
        next(error);
    }
}
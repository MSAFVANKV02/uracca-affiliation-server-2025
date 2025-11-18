import mongoose from "mongoose";
import { Commissions } from "../../models/commissionSchema.js";
import { encryptData } from "../../utils/cript-data.js";
import { NotFoundError } from "../../utils/errors.js";

export const userAllCommissionDetails = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const adminId = req.user.workingOn;

    if (!userId) {
      throw new NotFoundError("No user found");
    }

    const {
      period = "6month",
      sort = "newest",
      campaignId = "all",
    } = req.query;

    // DATE FILTERS
    const now = new Date();
    let startDate;

    switch (period) {
      case "6month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case "this-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "this-year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    const endDate = new Date();

    const query = {
      userId,
      adminId,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // IMPORTANT FIX: Convert campaignId to ObjectId
    if (campaignId !== "all") {
      query.campaignId = new mongoose.Types.ObjectId(campaignId);
    }

    const sortOrder = sort === "oldest" ? 1 : -1;

    const commissions = await Commissions.find(query)
      .populate("campaignId")
      .sort({ createdAt: sortOrder });

    const encryptedData = encryptData(commissions);

    return res.status(200).json({
      success: true,
      message: "Commission found",
      data: encryptedData,
    });
  } catch (error) {
    next(error);
  }
};

// export const userAllCommissionDetails = async (req, res, next) => {
//   try {
//     const userId = req.user._id;
//     const adminId = req.user.workingOn;

//     if (!userId) {
//       throw new NotFoundError("No user found ");
//     }
//     console.log(req.query);

//     // 1. find commission with the user and admin
//     const commission = await Commissions.find({
//       userId,
//       adminId,
//     }).populate("campaignId");

//     if (!commission) {
//       throw new NotFoundError("No commission found for this req");
//     }

//     const encryptedData = encryptData(commission)

//     return res.status(200).json({
//       message: "Commission found",
//       data: commission,
//       success: true,
//     });
//   } catch (error) {
//     // console.log(error);
//     next(error);
//   }
// };

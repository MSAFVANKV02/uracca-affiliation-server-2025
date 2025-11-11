import AffUser from "../../models/aff-user.js";
import { UserTypeEnum } from "../../models/enum.js";
import { encryptData } from "../../utils/cript-data.js";

export const getAllAffUsers = async (req, res) => {
  // console.log('getAllAffUsers');

  try {
    // Build filter object from query params
    const filters = {};
    for (const key in req.query) {
      if (req.query[key]) {
        filters[key] = req.query[key];
      }
    }

    // Apply filters if any, otherwise return all
    const users = Object.keys(filters).length
      ? await AffUser.find(filters)
      : await AffUser.find();

    // Encrypt the data before sending
    const encryptedData = encryptData(users);

    res.status(200).json({
      success: true,
      count: users.length,
      data: encryptedData,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// =============
export const getAllAffUsersForEachAdmins = async (req, res) => {
  try {
    const adminId = req.admin._id || req.query.adminId; // current admin
    const adminType = req.admin.userType || req.query.userType; // current admin's role
    // console.log(adminId,'adminId');

    // Build filter object from query params
    const filters = {};
    for (const key in req.query) {
      if (req.query[key] && !["adminId", "userType"].includes(key)) {
        filters[key] = req.query[key];
      }
    }

    // ✅ Exclude the current admin from all results
    if (adminId) {
      filters._id = { $ne: adminId };
    }

    // ✅ Conditional logic for SUPER_ADMIN vs others
    if (adminType !== UserTypeEnum.SUPER_ADMIN) {
      // Only show users collaborating with this admin
      filters.collaborateWith = {
        $elemMatch: {
          accountId: adminId,
          status: "ACCEPTED",
        },
      };
    }

    // ✅ Fetch filtered users
    const users = await AffUser.find(filters);

    // Encrypt the data before sending
    const encryptedData = encryptData(users);

    res.status(200).json({
      success: true,
      count: users.length,
      data: encryptedData,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

// =========

export const getAllAdminsAffUsers = async (req, res) => {
  // console.log('getAllAffUsers');

  try {
    // Build filter object from query params

    const admins = await AffUser.find({
      userType: { $in: ["ADMIN", "SUPER_ADMIN"] },
    })
      .select(
        "_id domain avatar userName campaignAccessKey campaignId collaborateWith"
      )
      .populate("domain", "name, url");

    return res
      .status(200)
      .json(
        { data: admins, message: "All Admins Fetched Successfully" },
        { status: 200 }
      );
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

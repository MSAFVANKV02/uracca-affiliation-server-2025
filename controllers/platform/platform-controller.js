import { Platform } from "../../models/platformSchema.js";

// ---------------------- 📋 Get Platform Settings ----------------------
export const getPlatformSettings = async (req, res) => {
  try {
    // Always fetch the first (and only) Platform document
    const adminId = req.admin._id  
    console.log(adminId,"req in getPlatformSettings");
    if(!adminId){
      return res.status(400).json({
        success: false,
        message: "Admin ID is required to fetch platform settings",
      });
    }
    
    let platform = await Platform.findOne({adminId});
    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform settings not found for the given admin ID",
      });
    }

    // if (!platform) {
    //     // ✅ Create default platform matching the new schema
    //     platform = await Platform.create({
    //       domain: "",
    //       commission: 0,
    //       adminId:adminId,
    //       paymentMethods: {
    //         type: "ENTER",
    //         minAmount: 0,
    //         maxAmount: 0,
    //         amount: [],
    //       },
  
    //       bankTransfer: {
    //         enabled: true,
    //         amountType: "PERCENT",
    //         transferCharge: 0,
    //       },
  
    //       onlineTransfer: {
    //         enabled: true,
    //         amountType: "PERCENT",
    //         transferCharge: 0,
    //       },
  
    //       tdsLinkedMethods: {
    //         type: "PERCENT",
    //         amount: 0,
    //       },
  
    //       tdsUnLinkedMethods: {
    //         type: "PERCENT",
    //         amount: 0,
    //       },
  
    //       termAndConditions: {
    //         rules: [],
    //         policy: "",
    //       },
    //     });
    //   }
  

    return res.status(200).json({
      success: true,
      message: "Platform settings fetched successfully",
      data: platform,
    });
  } catch (error) {
    console.error("❌ Error fetching platform settings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching platform settings",
      error: error.message,
    });
  }
};


export const getPlatformForUserSettings = async (req, res) => {
  try {
    // Always fetch the first (and only) Platform document
    const adminId = req.params.adminId;
    console.log(adminId,"req in getPlatformSettings");
    if(!adminId){
      return res.status(400).json({
        success: false,
        message: "Admin ID is required to fetch platform settings",
      });
    }
    
    let platform = await Platform.findOne({adminId});

    if (!platform) {
      return res.status(404).json({
        success: false,
        message: "Platform settings not found for the given admin ID",
      });
    }
  

    return res.status(200).json({
      success: true,
      message: "Platform settings fetched successfully",
      data: platform,
    });
  } catch (error) {
    console.error("❌ Error fetching platform settings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching platform settings",
      error: error.message,
    });
  }
};

// ---------------------- 📋 Update Platform Settings ----------------------
export const updatePlatformSettings = async (req, res) => {
  try {
    const { updateFields } = req.body;
    const adminId = req.admin._id;
    // Always update the first Platform document
    let platform = await Platform.findOne({ adminId });

    if (!platform) {
      // If no Platform exists, create one
      platform = await Platform.create(updateFields);
    } else {
      // Update the existing Platform
      Object.keys(updateFields).forEach((key) => {
        platform[key] = updateFields[key];
      });
      await platform.save();
    }

    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      data: platform,
    });
  } catch (error) {
    // console.error("❌ Error updating platform settings:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating platform settings",
      error: error.message,
    });
  }
};

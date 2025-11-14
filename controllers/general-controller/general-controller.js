import { UserTypeEnum } from "../../models/enum.js";
import { Settings } from "../../models/settingsSchema.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";

// ---------------------- 📋 Update General Settings ----------------------
export const updateAffGeneralSettings = async (req, res, next) => {
  try {
    const adminId = req.admin._id;

    if (req.admin.userType !== UserTypeEnum.SUPER_ADMIN) {
      throw new BadRequestError("Cant update settings for this account");
    }

    const {
      colors = [],
      bgColors = [],
      bgGradientColors = [],
      textGradientColors = [],
      files = { images: [], videos: [] },
    } = req.body;

    // 🔥 Ensure url is ALWAYS an array
    const normalizeFileArray = (data) =>
      data?.map((item) => ({
        placement: item.placement,
        isEnabled: item.isEnabled,
        url: Array.isArray(item.url) ? item.url : item.url ? [item.url] : [],
      })) || [];

    const updateData = {
      adminId,
      files: {
        images: normalizeFileArray(files.images),
        videos: normalizeFileArray(files.videos),
      },
      theme: {
        colors,
        bgColors,
        bgGradientColors,
        textGradientColors,
      },
    };

    let platform = await Settings.findOne({ adminId });

    if (!platform) {
      platform = await Settings.create(updateData);
    } else {
      Object.assign(platform, updateData);
      await platform.save();
    }

    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      data: platform,
    });
  } catch (error) {
    next(error);
  }
};

// export const updateAffGeneralSettings = async (req, res, next) => {
//     try {
//       const adminId = req.admin._id; // or req.body.adminId (your authentication logic)

//       if(req.admin.userType !== UserTypeEnum.SUPER_ADMIN){
//         throw new BadRequestError("Cant update settings for this account")
//       }

//       const {
//         colors = [],
//         bgColors = [],
//         bgGradientColors = [],
//         textGradientColors = [],
//         files = { images: [], videos: [] },
//       } = req.body;

//       // shape document according to schema
//       const updateData = {
//         adminId,
//         files: {
//           images: files.images || [],
//           videos: files.videos || [],
//         },
//         theme: {
//           colors: colors || [],
//           bgColors: bgColors || [],
//           bgGradientColors: bgGradientColors || [],
//           textGradientColors: textGradientColors || [],
//         },
//       };

//       // ✔ find existing settings for admin
//       let platform = await Settings.findOne({ adminId });

//       if (!platform) {
//         // ✔ create only if not exist
//         platform = await Settings.create(updateData);
//       } else {
//         // ✔ update existing document
//         Object.assign(platform, updateData);
//         await platform.save();
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Platform settings updated successfully",
//         data: platform,
//       });
//     } catch (error) {
//       next(error);
//     }
//   };

// ---------------------- 📋 Get General Settings ----------------------
export const getAffGeneralSettings = async (req, res, next) => {
  try {
    // console.log(req.admin);

    // const adminId = req.admin._id; // from auth middleware

    // if(!adminId){
    //   throw new NotFoundError("AdminId Not Found!")
    // }

    // let settings = await Settings.findOne({ adminId });
    let settings = await Settings.find();

    // If no settings exist, send empty default structure (same as frontend)
    if (!settings) {
      return res.status(401).json({
        success: true,
        message: "No settings found, returning default values",
        data: {
          // adminId,
          files: {
            images: [],
            videos: [],
          },
          theme: {
            colors: [],
            bgColors: [],
            bgGradientColors: [],
            textGradientColors: [],
          },
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Settings fetched successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

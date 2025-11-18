import { NpmPackage } from "../../models/npmSchema.js";
import { generateApiKey } from "../../utils/generateApiKey.js";

export const createNpmPackagePlatform = async (req, res, next) => {
  try {
    const { platformName, domain } = req.body;

    if (!platformName || !domain) {
      return res.status(400).json({ message: "platformName & domain required" });
    }

    // 🔸 Check if domain already exists
    const exist = await NpmPackage.findOne({ domain });
    if (exist) {
      return res.status(400).json({ message: "Domain already registered" });
    }

    // 🔸 Generate unique API key
    const apiKey = generateApiKey();

    // 🔥 Step 1: Set ALL existing platform keys to inactive
    await NpmPackage.updateMany({}, { $set: { active: false } });

    // 🔥 Step 2: Create the new platform as active
    const platform = await NpmPackage.create({
      platformName,
      domain,
      apiKey,
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: "Platform registered successfully",
      platform,
    });
  } catch (err) {
    next(err);
  }
};

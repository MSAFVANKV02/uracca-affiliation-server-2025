import { NpmPackage } from "../models/npmSchema.js";


export const validatePlatformApiKey = async (req, res, next) => {
  try {
    const key = req.headers["x-api-key"];

    if (!key)
      return res.status(401).json({ message: "API key missing in header" });

    const platform = await NpmPackage.findOne({ apiKey: key });

    if (!platform)
      return res.status(401).json({ message: "Invalid API key" });

    req.platform = platform;
    next();
  } catch (err) {
    next(err);
  }
};

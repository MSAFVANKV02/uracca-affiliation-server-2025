import { NpmPackage } from "../models/npmSchema.js";


export const validatePlatformApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    const domain = req.headers["x-domain"];

    if (!apiKey || !domain)
      return res.status(401).json({ message: "Missing headers" });

    const platform = await NpmPackage.findOne({ apiKey, domain });

    if (!platform)
      return res.status(401).json({ message: "Invalid domain or apiKey" });

    req.platform = platform;
    next();
  } catch (err) {
    next(err);
  }
};

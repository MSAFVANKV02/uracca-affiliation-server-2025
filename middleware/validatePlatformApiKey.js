import { NpmPackage } from "../models/npmSchema.js";
import { MissingFieldError } from "../utils/errors.js";


export const validatePlatformApiKey = async (req, res, next) => {
  console.log("inside validate Platform Api Key");

  try {
    const apiKey = req.headers["x-api-key"];
    const domain = req.headers["x-domain"];

    if (!apiKey || !domain){
      throw new MissingFieldError("Missing headers");
      // return res.status(401).json({ message: "Missing headers" });
    }
      

    const platform = await NpmPackage.findOne({ apiKey, domain });

    if (!platform)
      return res.status(401).json({ message: "Invalid domain or apiKey" });

    req.platform = platform;
    next();
  } catch (err) {
    next(err);
  }
};

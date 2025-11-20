import { NpmPackage } from "../models/npmSchema.js";
import { InvalidError, MissingFieldError } from "../utils/errors.js";

const normalizeOrigin = (url) => {
  if (!url) return "";
  return url.replace(/\/$/, "").toLowerCase(); // remove ending `/`
};

export const validatePlatformApiKey = async (req, res, next) => {
  console.log("inside validate Platform Api Key");

  try {
    const apiKey = req.headers["x-api-key"];
    const domain = req.headers["x-domain"];
    const origin = req.headers.origin;
    // console.log(apiKey,"apiKey");
    // console.log(domain,"domain");

    if (!apiKey || !domain || !origin) {
      throw new MissingFieldError("Missing headers");
    }
    const cleanOrigin = normalizeOrigin(origin);
    const cleanHeaderDomain = normalizeOrigin(domain);

    const platform = await NpmPackage.findOne({ apiKey, domain });
    if (!platform) {
      throw new InvalidError("Invalid domain or apiKey");
      // return res.status(401).json({ message: "Missing headers" });
      // return res.status(401).json({ message: "Invalid domain or apiKey" });
    }
    const cleanDbDomain = normalizeOrigin(platform.domain);

    // 🚨 ONLY MATCH IF ORIGIN === DOMAIN EXACTLY
    if (cleanOrigin !== cleanDbDomain || cleanHeaderDomain !== cleanDbDomain) {
      throw new InvalidError("Domain mismatch");
    }

    req.platform = platform;
    next();
  } catch (err) {
    next(err);
  }
};

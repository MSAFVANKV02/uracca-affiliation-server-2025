import crypto from "crypto";
import { Campaign } from "../models/campaignSchema.js";

export const generateCampaignAccessKey = () => {
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase(); // e.g. 'A1B2C3'
  const timestampPart = Date.now().toString().slice(-6); // last 6 digits of timestamp
  return `AFF_${timestampPart}${randomPart}_CAMP`;
};


const generateUniqueCampaignAccessKey = async () => {
    let key;
    let exists = true;
    while (exists) {
      key = generateCampaignAccessKey();
      exists = await Campaign.exists({ campaignAccessKey: key });
    }
    return key;
  };
export default generateUniqueCampaignAccessKey;  
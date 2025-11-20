import { API } from "../api/request.js";

export const TrackClick = async ({ referralId, campaignAccessKey }) => {
  return API.post("/affiliate/clicks", {
    referralId,
    campaignAccessKey,
  });
};

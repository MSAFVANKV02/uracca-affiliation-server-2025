import { API } from "../request";


export const TrackClick = async ({ referralId, campaignAccessKey }) => {
  return API.post("/affiliate/clicks", {
    referralId,
    campaignAccessKey,
  });
};

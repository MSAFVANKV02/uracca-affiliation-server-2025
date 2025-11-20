import { API } from "../api/request.js";

export const OrderCampaign = async ({
  referralId,
  campaignAccessKey,
  productDetails = [],
  orderId
}) => {
  return API.post("/affiliate/purchase-campaign", {
    referralId,
    campaignAccessKey,
    productDetails,
    orderId,
  });
};

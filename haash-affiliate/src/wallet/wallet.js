import { API } from "../api/request.js";

export const CancelCommission = async (orderId) => {
  return API.patch(`/affiliate/cancel-amount/${orderId}`);
};

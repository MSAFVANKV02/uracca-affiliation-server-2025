import { API } from "../request";


export const CancelCommission = async (orderId) => {
  return API.patch(`/affiliate/cancel-amount/${orderId}`);
};

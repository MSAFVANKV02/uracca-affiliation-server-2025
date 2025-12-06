// utils/createNotification.js

import { UserActionEnum, UserCategoryEnum } from "../models/enum.js";
import AffiliateNotifications from "../models/notificationSchema.js";


export async function createNotification({
  userId,
  action = UserActionEnum.GENERAL,
  recipientType = "user",
  category = UserCategoryEnum.GENERAL,
  message,
  metadata = {},
}) {
  try {
    await AffiliateNotifications.create({
      user: userId,
      action,
      recipientType,
      category,
      message,
      metadata,
    });
  } catch (err) {
    console.error("🔥 Notification Error:", err.message);
  }
}

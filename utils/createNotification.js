// utils/createNotification.js

import AffUser from "../models/aff-user.js";
import { UserActionEnum, UserCategoryEnum } from "../models/enum.js";
import AffiliateNotifications from "../models/notificationSchema.js";

export async function createNotification({
  userId,
  action = UserActionEnum.GENERAL,
  recipientType = "USER",
  category = UserCategoryEnum.GENERAL,
  message,
  metadata = {},
}) {
  try {
    // 1️⃣ Check user notification preference
    const user = await AffUser.findById(userId)
      .select("notifications.isOn")
      .lean();

    // 🔕 Notifications OFF → skip silently
    if (!user?.notifications?.isOn) {
      return;
    }

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

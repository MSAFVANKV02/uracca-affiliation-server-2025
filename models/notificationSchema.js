import mongoose from "mongoose";
import { UserActionEnum, UserCategoryEnum } from "./enum";

const NotificationsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    action: {
      type: String,
      enum: Object.values(UserActionEnum),
      required: true,
    },
    recipientType: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // optional type for categorization (payout, account, referral, etc.)
    category: {
      type: String,
      enum: Object.values(UserCategoryEnum),
      default: UserCategoryEnum.GENERAL,
    },

    metadata: { type: Object, default: {} }, // store extra info (method, IP, etc.)

    message: {
      type: String,
      default: function (this) {
        switch (this.action) {
          case UserActionEnum.SET_PIN:
            return "Withdrawal PIN set";
          case UserActionEnum.CHANGE_PIN:
            return "Withdrawal PIN changed";
          case UserActionEnum.WITHDRAWAL_ACCEPT:
            return "Withdrawal Accepted";
          case UserActionEnum.WITHDRAWAL_REJECT:
            return "Withdrawal rejected";
          case UserActionEnum.WITHDRAWAL_REQUEST:
            return "Withdrawal requested";
          case UserActionEnum.CHANGE_PASSWORD:
            return "Password changed";
          case UserActionEnum.CAMPAIGN_STARTED:
            return "User started the campaign";
          case UserActionEnum.ACCOUNT_DELETION:
            return "User deleted the account permanently";
          case UserActionEnum.USER_REFER:
            return "User used the referral link";
          default:
            return "User action recorded";
        }
      },
    },
    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const AffiliateNotifications =
  mongoose.models.Notifications ||
  mongoose.model("Notifications", NotificationsSchema);

export default AffiliateNotifications;

import mongoose from "mongoose";
import { UserTypeEnum } from "./enum.js";

const settingsSchema = new mongoose.Schema(
  {
    // clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: {
      images: [
        {
          placement: { type: String },
          url: [{ type: String }],
          isEnabled:Boolean
        },
      ],
      videos: [
        {
          placement: { type: String },
          url: [{ type: String }],
          isEnabled:Boolean

        },
      ],
    },
    theme: {
      colors: {
        type: [String],
      },
      bgColors: {
        type: [String],
      },
      bgGradientColors: {
        type: [String],
      },
      textGradientColors: {
        type: [String],
      },
    },
  },
  { timestamps: true }
);

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", settingsSchema);

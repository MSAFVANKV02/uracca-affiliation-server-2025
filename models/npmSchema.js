import mongoose from "mongoose";

const npmPackageSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      required: true,
      trim: true,
    },

    domain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    apiKey: {
      type: String,
      required: true,
      unique: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const NpmPackage =
  mongoose.models.NpmPackage || mongoose.model("NpmPackage", npmPackageSchema);

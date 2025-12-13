import mongoose from "mongoose";
import { UserTypeEnum } from "./enum.js";

const ruleSchema = new mongoose.Schema({
  // _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
  text: { type: String, required: true }, // The actual rule text
});

const termAndConditionsSchema = new mongoose.Schema({
  rules: [ruleSchema], // Array of subdocuments
  policy: { type: String },
});

const platformSchema = new mongoose.Schema(
  {
    // clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    domain: { type: String,  },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accessKey: { type: mongoose.Schema.Types.ObjectId, ref: "NpmPackage" },
    adminType: {
      type: String,
      enum: Object.values(UserTypeEnum),
      default: UserTypeEnum.USER,
      // required: true,
    },
    commission: { type: Number, default: 0 },
    returnPeriod: { type: Number, default: 0 },
    backendRoutes:{
      products:String
    },
    paymentMethods: {
      type: {
        type: String,
        enum: ["MONTHLY", "LIMITED", "ENTER"],
        default: "",
      },
      minAmount: { type: Number },
      maxAmount: { type: Number },
      amount: { type: [Number] },
    },
    bankTransfer: {
      enabled: { type: Boolean, default: true },
      amountType: {
        type: String,
        enum: ["FIXED", "PERCENT"],
        default: "PERCENT",
      },
      transferCharge: { type: Number },
    },
    onlineTransfer: {
      enabled: { type: Boolean, default: true },
      amountType: {
        type: String,
        enum: ["FIXED", "PERCENT"],
        default: "PERCENT",
      },
      transferCharge: { type: Number },
    },
    tdsLinkedMethods: {
      type: { type: String, enum: ["FIXED", "PERCENT"], default: "PERCENT" },
      amount: { type: Number, default: 0 },
    },
    tdsUnLinkedMethods: {
      type: { type: String, enum: ["FIXED", "PERCENT"], default: "PERCENT" },
      amount: { type: Number, default: 0 },
    },
    termAndConditions: termAndConditionsSchema,
  },
  { timestamps: true }
);

export const Platform =
  mongoose.models.Platform || mongoose.model("Platform", platformSchema);

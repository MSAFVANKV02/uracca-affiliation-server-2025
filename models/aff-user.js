import mongoose from "mongoose";
import { UserTypeEnum, statusEnum } from "./enum.js";

const addressSchema = new mongoose.Schema({
  name: { type: String },
  mobile: { type: String },
  city: { type: String },
  buildingNo: { type: String },
  street: { type: String },
  landmark: { type: String },
  state: { type: String },
  country: { type: String },
  pinCode: { type: String },
});

const socialSchema = new mongoose.Schema({
  instagram: { type: String },
  youtube: { type: String },
  facebook: { type: String },
});

const affTypeSchema = new mongoose.Schema({
  type: { type: String,default:"INDIVIDUAL" , enum:["INDIVIDUAL","SPECIAL","COMPANY"] },
  commission: { type: Number },
  commissionType:  { type: String,default:"ONLY_AFF_PRODUCT" , enum:["ALL_PRODUCT","ONLY_AFF_PRODUCT"] },
  tdsType: {
    type: String,
    enum: ["LINKED","UN_LINKED"],
    default: "LINKED",
  },
});

const notificationsSchema = new mongoose.Schema({
  isOn: { type: Boolean, default: true },
  preferences: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
  },
});

const documentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, required: true },
});

// ✅ Referral ID generator
let AffUser; // declare first to avoid reference error
const generateReferralId = async () => {
  const year = new Date().getFullYear().toString().slice(-2);
  let referralId;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    referralId = `AFF${year}${randomNum}`;
    const existing = await AffUser.findOne({ referralId });
    if (!existing) exists = false;
  }
  return referralId;
};

const userSchema = new mongoose.Schema(
  {
    userName: String,
    userType: {
      type: String,
      enum: Object.values(UserTypeEnum),
      default: UserTypeEnum.USER,
      required: true,
    },
    affType:affTypeSchema,
    avatar: String,
    fullName: String,
    email: String,
    mobile: String,
    password: { type: String, required: false },
    isVerified: { type: Boolean, default: false },
    preference: String,
    isBlocked: { type: Boolean, default: false },
    policyVerified: { type: Boolean, default: false },

    status: {
      type: String,
      enum: Object.values(statusEnum),
      default: statusEnum.PENDING,
    },

    registrationVerified: { type: Boolean, default: false },
    campaignStarted: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    referralId: { type: String, unique: true },

    gender: { type: String },
    social: socialSchema,
    notifications: notificationsSchema,
    documents: [documentSchema],
    address: [addressSchema],

    forgotPin: { type: String, default: "" },
    otp: { type: String },
    otpExpiry: { type: Date },

    actions: {
      totalClicks: [
        {
          date: String,
          clicks: Number,
        },
      ],
      totalOrders: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
    },

    payouts: {
      totalAmount: { type: Number, default: 0 },
      pendingAmount: { type: Number, default: 0 },
      paidAmount: { type: Number, default: 0 },
      cancelledAmount: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 },
      balanceAmount: { type: Number, default: 0 },
    },

    withdrawalDetails: {
      bank: {
        accountHolderName: { type: String, default: "" },
        accountNumber: { type: String, default: "" },
        bankName: { type: String, default: "" },
        ifscCode: { type: String, default: "" },
        upiId: { type: String, default: "" },
      },
      withdrawalPin: { type: String, default: "" },
      havePin: { type: Boolean, default: false },
      haveBank: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// ✅ Pre-save hook
userSchema.pre("save", async function (next) {
  if (!this.referralId) {
    this.referralId = await generateReferralId();
  }
  next();
});

AffUser = mongoose.models.User || mongoose.model("User", userSchema);

export default AffUser;

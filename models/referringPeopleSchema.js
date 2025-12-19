import mongoose from "mongoose";

const referringSchema = new mongoose.Schema({
  parentUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // the referrer
  childUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // the new user
  referralCode: String, // the code used
  level: { type: Number, default: 1 }, // level 1,2,3... for MLM chain
  createdAt: { type: Date, default: Date.now },
});

export const Referring =
  mongoose.models.Referring ||
  mongoose.model("Referring", referringSchema);

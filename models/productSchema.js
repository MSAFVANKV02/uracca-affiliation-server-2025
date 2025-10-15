import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    domain: { type: String, required: true },
    productId: { type: String, required: true }, // original product ID from client
    productData: { type: mongoose.Schema.Types.Mixed }, // dynamic data, can store any JSON
    commission: { type: Number, default: 0 },
    // affiliate: {
    //   commission: { type: Number, default: 0 },
    //   commissionType: { type: String, enum: ["FIXED", "PERCENT"], default: "PERCENT" },
    //   isActive: { type: Boolean, default: true },
    // },
    tags: [String],
    category: String,
    status: { type: String,enum:["ACTIVE","PAUSED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

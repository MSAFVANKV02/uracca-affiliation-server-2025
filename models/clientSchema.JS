import mongoose from "mongoose";

const clientSchema = new mongoose.Schema({
    name: String,
    backendType: { type: String, enum: ["REST", "GRAPHQL", "OTHER"] },
    productMapping: {
      title: String, // maps to `productData.title`
      price: String, // maps to `productData.price`
      image: String, // maps to `productData.image`
      // etc.
    },
  });
  
  export const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);
  
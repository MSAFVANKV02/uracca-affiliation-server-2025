import mongoose from "mongoose";

const domainSchema = new mongoose.Schema({
  registeredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: { type: String, required: true, unique: true }, // e.g. "uracca" or "admin.uracca"
  url: { type: String, required: true, unique: true }, // e.g. "https://www.uracca.com"
  logo: { type: String },
});

const Domains = mongoose.models.domain || mongoose.model("domain", domainSchema);

export default Domains;

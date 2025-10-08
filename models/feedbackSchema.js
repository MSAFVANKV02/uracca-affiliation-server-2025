import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, required: true }, // "pdf", "image", "video", etc.
});

const FeedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resolved: {
      type: Boolean,
      default:false
    },

  status: {
      type: String,
      enum: ["PENDING","READ"],
      default:"PENDING"
    },
    type: {
      type: String,
      enum: ["BUG-REPORT", "SUGGESTIONS", "GENERAL"],
      required: true,
    },
    feedback: {
      type: String,
    },
    images: [documentSchema],

    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const AffiliateFeedbacks =
  mongoose.models.Feedbacks || mongoose.model("Feedbacks", FeedbackSchema);

export default AffiliateFeedbacks;

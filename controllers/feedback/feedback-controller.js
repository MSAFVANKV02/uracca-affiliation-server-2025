import AffiliateFeedbacks from "../../models/feedbackSchema.js";

// ---------------------- 📋 Get All Feedbacks ----------------------
export const getAllAffiliateFeedbacks = async (req, res) => {
  try {
    const feedbacks = await AffiliateFeedbacks.find()
      .populate("user", "userName email mobile") // populate basic user info
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Feedbacks fetched successfully",
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("❌ Error fetching feedbacks:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching feedbacks",
      error: error.message,
    });
  }
};

// ---------------------- 🔍 Get Feedback by ID ----------------------
export const getAffiliateFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const feedback = await AffiliateFeedbacks.findById(id).populate(
      "user",
      "userName email mobile"
    );

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback fetched successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("❌ Error fetching feedback by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message,
    });
  }
};

// ---------------------- 🗑️ Delete Feedback by ID ----------------------
export const deleteAffiliateFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedFeedback = await AffiliateFeedbacks.findByIdAndDelete(id);

    if (!deletedFeedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
      data: deletedFeedback,
    });
  } catch (error) {
    console.error("❌ Error deleting feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting feedback",
      error: error.message,
    });
  }
};

// ---------------------- 📋 update Feedbacks ----------------------
export const updateFeedbacksStatus = async (req, res) => {
  try {
    const { updateFields } = req.body;
    const { id } = req.params;

    console.log(updateFields,'updateFields');
    

    const feedbacks = await AffiliateFeedbacks.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).populate("user");

    return res.status(200).json({
      success: true,
      message: "Feedbacks Updated successfully",
      data: feedbacks,
    });
  } catch (error) {
    console.error("❌ Error fetching feedbacks:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating feedbacks",
      error: error.message,
    });
  }
};

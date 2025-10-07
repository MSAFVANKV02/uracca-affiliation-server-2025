import Withdrawals from "../../models/withdrawalSchema.js";



export const getAllAffWithdrawalHistory = async (req, res) => {
  try {
    const filters = {};
    for (const key in req.query) {
      if (req.query[key]) {
        // console.log(req.query,'req.query');
        
        filters[key] = req.query[key];
      }
    }

    const users = Object.keys(filters).length
      ? await Withdrawals.find(filters).populate("user")
      : await Withdrawals.find().populate("user"); // fixed here

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};


// update Aff Withdrawal Status

export const updateAffWithdrawalStatus = async (req, res) => {
  try {
    const { withdrawalId, status, rejectReason } = req.body;

    if (!withdrawalId || !status) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal ID and status are required.",
      });
    }

    // Build update object
    const updateFields = { status };
    if (status === "REJECTED") {
      updateFields.rejectReason = rejectReason || "No reason provided";
    } else {
      updateFields.rejectReason = ""; // clear reason if accepted/processed
    }

    // Update only specific fields without triggering validation errors
    const updatedWithdrawal = await Withdrawals.findByIdAndUpdate(
      withdrawalId,
      { $set: updateFields },
      {
        new: true,
        runValidators: false, // prevent required field validation
      }
    ).populate("user");

    if (!updatedWithdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Withdrawal status updated to ${status}`,
      data: updatedWithdrawal,
    });
  } catch (error) {
    console.error("Error updating withdrawal status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating withdrawal status.",
    });
  }
};



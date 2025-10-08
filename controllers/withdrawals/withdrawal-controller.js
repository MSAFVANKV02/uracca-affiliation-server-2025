import AffUser from "../../models/aff-user.js";
import { UserActionEnum, UserCategoryEnum } from "../../models/enum.js";
import Withdrawals from "../../models/withdrawalSchema.js";
import { addHistory } from "../../utils/history.js";

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

    // ------------------ 🧾 Basic Validation ------------------
    if (!withdrawalId || !status) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal ID and status are required.",
      });
    }

    // ------------------ 🔍 Fetch Withdrawal ------------------
    const withdrawal = await Withdrawals.findById(withdrawalId).populate("user");
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    const user = withdrawal.user;

    // ------------------ ⚠️ Validate User Balance ------------------
    if (
      status === "COMPLETED" &&
      (!user.payouts || user.payouts.pendingAmount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Cannot complete withdrawal. User has no pending payout amount.",
      });
    }

    // ------------------ 🧩 Prepare Update Fields ------------------
    const updateFields = {
      status,
      rejectReason: status === "REJECTED" ? rejectReason || "No reason provided" : "",
    };

    // ------------------ 🛠️ Update Withdrawal ------------------
    const updatedWithdrawal = await Withdrawals.findByIdAndUpdate(
      withdrawalId,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).populate("user");

    if (!updatedWithdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found after update.",
      });
    }

    // ------------------ ❌ Handle Rejected Withdrawal ------------------
    if (status === "REJECTED") {
      await AffUser.findByIdAndUpdate(
        user._id,
        { $set: { "payouts.pendingAmount": 0 } },
        { new: true }
      );

      await addHistory(
        user._id,
        UserActionEnum.WITHDRAWAL_REJECT,
        withdrawal.withdrawalAmount,
        UserCategoryEnum.PAYOUT,
        {
          method: withdrawal.paymentMethod,
          reason: updateFields.rejectReason,
        }
      );
    }

    // ------------------ ✅ Handle Completed Withdrawal ------------------
    if (status === "COMPLETED") {
      const { withdrawalAmount, balanceBefore, balanceAfter, paymentMethod } =
        updatedWithdrawal;

      await addHistory(
        user._id,
        UserActionEnum.WITHDRAWAL_COMPLETED,
        withdrawalAmount,
        UserCategoryEnum.PAYOUT,
        { method: paymentMethod, balanceBefore, balanceAfter }
      );

      await AffUser.findByIdAndUpdate(
        user._id,
        {
          $inc: {
            "payouts.paidAmount": withdrawalAmount,
          },
          $set: {
            "payouts.pendingAmount": 0,
          },
        },
        { new: true }
      );
    }

    // ------------------ 🟢 Success Response ------------------
    return res.status(200).json({
      success: true,
      message: `Withdrawal status updated to ${status}`,
      data: updatedWithdrawal,
    });
  } catch (error) {
    console.error("❌ Error updating withdrawal status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating withdrawal status.",
      error: error.message,
    });
  }
};


// export const updateAffWithdrawalStatus = async (req, res) => {
//   try {
//     const { withdrawalId, status, rejectReason } = req.body;

//     if (!withdrawalId || !status) {
//       return res.status(400).json({
//         success: false,
//         message: "Withdrawal ID and status are required.",
//       });
//     }

//      // ✅ Find withdrawal with user details before updating
//      const withdrawal = await Withdrawals.findById(withdrawalId).populate("user");

//      if (!withdrawal) {
//        return res.status(404).json({
//          success: false,
//          message: "Withdrawal request not found.",
//        });
//      }
 
//      // ✅ Check user's pending amount before marking completed
//      const user = withdrawal.user;
//      if (status === "COMPLETED" && (!user.payouts || user.payouts.pendingAmount <= 0)) {
//        return res.status(400).json({
//          success: false,
//          message: "Cannot complete withdrawal. User has no pending payout amount.",
//        });
//      }

//     // Build update object
//     const updateFields = { status };
//     if (status === "REJECTED") {
//       updateFields.rejectReason = rejectReason || "No reason provided";
//     } else {
//       updateFields.rejectReason = ""; // clear reason if accepted/processed
//     }

//     // Update only specific fields without triggering validation errors
//     const updatedWithdrawal = await Withdrawals.findByIdAndUpdate(
//       withdrawalId,
//       { $set: updateFields },
//       {
//         new: true,
//         runValidators: false, // prevent required field validation
//       }
//     ).populate("user");
//     if(status === "REJECTED"){
//       await AffUser.findByIdAndUpdate(
//         updatedWithdrawal.user._id,
//         {
//           $set: { "payouts.pendingAmount": 0 }, // reset pending amount
//         },
//         { new: true }
//       );
//     }

//     if (status === "COMPLETED") {
//       console.log(status, "status status status");

//       const { withdrawalAmount, balanceBefore, balanceAfter, paymentMethod } =
//         updatedWithdrawal;

//       await addHistory(
//         updatedWithdrawal.user._id,
//         UserActionEnum.WITHDRAWAL_COMPLETED,
//         withdrawalAmount,
//         UserCategoryEnum.PAYOUT,
//         {
//           method: paymentMethod,
//           balanceBefore,
//           balanceAfter,
//         }
//       );

//        // ✅ Update user's payout stats
//        await AffUser.findByIdAndUpdate(
//         updatedWithdrawal.user._id,
//         {
//           $inc: { "payouts.paidAmount": withdrawalAmount }, // add amount to paidAmount
//           $set: { "payouts.pendingAmount": 0 }, // reset pending amount
//         },
//         { new: true }
//       );
//     }

//     if (!updatedWithdrawal) {
//       return res.status(404).json({
//         success: false,
//         message: "Withdrawal request not found.",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       message: `Withdrawal status updated to ${status}`,
//       data: updatedWithdrawal,
//     });
//   } catch (error) {
//     console.error("Error updating withdrawal status:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while updating withdrawal status.",
//     });
//   }
// };

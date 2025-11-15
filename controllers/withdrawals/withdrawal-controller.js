import Razorpay from "razorpay";
import AffUser from "../../models/aff-user.js";
import { UserActionEnum, UserCategoryEnum } from "../../models/enum.js";
import { Platform } from "../../models/platformSchema.js";
import { Wallet } from "../../models/walletSchema.js";
import Withdrawals from "../../models/withdrawalSchema.js";
import { addHistory } from "../../utils/history.js";
import bcrypt from "bcryptjs";
import { createRazorpayContactAndFund } from "../../lib/RazorpayContactAndFund.js";
import { encryptData } from "../../utils/cript-data.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "rzp_test_4YU8jVusTNczuc",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "b6mKSb0YksLxVzKPiB4nudRl",
});

// export const getAllAffWithdrawalHistory = async (req, res) => {
//   try {
//     const filters = {};
//     for (const key in req.query) {
//       if (req.query[key]) {
//         // console.log(req.query,'req.query');

//         filters[key] = req.query[key];
//       }
//     }

//     const users = Object.keys(filters).length
//       ? await Withdrawals.find(filters).populate("user")
//       : await Withdrawals.find().populate("user"); // fixed here

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       data: users,
//     });
//   } catch (error) {
//     console.error("Error fetching users:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error while fetching users",
//     });
//   }
// };

export const getAllAffWithdrawalHistory = async (req, res) => {
  try {
    const filters = {};
    for (const key in req.query) {
      if (req.query[key]) filters[key] = req.query[key];
    }

    const adminId = req.admin;

    // ✅ Validate admin
    const admin = await AffUser.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ✅ Find all affiliate users where collaborateWith includes this admin
    const affUsers = await AffUser.find({
      collaborateWith: {
        $elemMatch: {
          accountId: adminId,
          status: "ACCEPTED",
        },
      },
    }).select("_id");

    const affUserIds = affUsers.map((u) => u._id);

    if (affUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: "No affiliate users linked with this admin",
      });
    }

    // ✅ Filter withdrawals that belong to these affiliate users
    const query = {
      ...filters,
      user: { $in: affUserIds },
    };

    const withdrawals = await Withdrawals.find(query)
      .populate(
        "user",
        "fullName email mobile referralId userName withdrawalDetails"
      )
      .sort({ createdAt: -1 });

    const encryptedData = encryptData(withdrawals);

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      data: encryptedData,
    });
  } catch (error) {
    // console.error("Error fetching affiliate withdrawal history:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching affiliate withdrawals",
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

    const withdrawal = await Withdrawals.findById(withdrawalId).populate(
      "user"
    );
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    const user = withdrawal.user;
    const wallet = await Wallet.findOne({
      userId: user._id,
      adminId: withdrawal.adminId,
    });

    if (!wallet) {
      return res
        .status(404)
        .json({ success: false, message: "User wallet not found." });
    }

    // Validation for COMPLETED
    if (
      status === "COMPLETED" &&
      (!wallet.pendingAmount || wallet.pendingAmount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot complete withdrawal. User has no pending payout amount.",
      });
    }

    // Build withdrawal update
    const withdrawalUpdate = {
      status,
      rejectReason:
        status === "REJECTED" ? rejectReason || "No reason provided" : "",
    };

    // ✅ Reset amounts if REJECTED or CANCELLED
    if (["REJECTED", "CANCELLED"].includes(status)) {
      withdrawalUpdate.withdrawalAmount = 0;
      withdrawalUpdate.requestedAmount = 0;
      withdrawalUpdate.cancelledAmount = withdrawal.requestedAmount;
    }

    // Update withdrawal record
    const updatedWithdrawal = await Withdrawals.findByIdAndUpdate(
      withdrawalId,
      { $set: withdrawalUpdate },
      { new: true, runValidators: false }
    ).populate("user");

    if (!updatedWithdrawal) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal not found after update.",
      });
    }

    // Prepare wallet updates
    let walletUpdate = {};

    if (status === "CANCELLED") {
      walletUpdate = {
        $inc: { balanceAmount: withdrawal.requestedAmount || 0 },
        $set: { pendingAmount: 0 },
      };

      await addHistory(
        user._id,
        UserActionEnum.WITHDRAWAL_CANCELLED,
        withdrawal.requestedAmount,
        UserCategoryEnum.PAYOUT,
        { method: withdrawal.paymentMethod }
      );
    }

    if (status === "COMPLETED") {
      const withdrawalAmount = withdrawal.withdrawalAmount || 0;
      walletUpdate = {
        $inc: {
          totalAmount: withdrawalAmount,
          paidAmount: withdrawalAmount,
        },
        $set: { pendingAmount: 0 },
      };

      await addHistory(
        user._id,
        UserActionEnum.WITHDRAWAL_COMPLETED,
        withdrawalAmount,
        UserCategoryEnum.PAYOUT,
        {
          method: withdrawal.paymentMethod,
          balanceBefore: withdrawal.balanceBefore,
          balanceAfter: withdrawal.balanceAfter,
        }
      );
    }

    if (status === "REJECTED") {
      walletUpdate = {
        $inc: { balanceAmount: withdrawal.requestedAmount || 0 },
        $set: { pendingAmount: 0 },
      };

      await addHistory(
        user._id,
        UserActionEnum.WITHDRAWAL_REJECT,
        withdrawal.withdrawalAmount,
        UserCategoryEnum.PAYOUT,
        {
          method: withdrawal.paymentMethod,
          reason: rejectReason || "No reason provided",
        }
      );
    }

    // ✅ Apply wallet update if any
    if (Object.keys(walletUpdate).length > 0) {
      await Wallet.findByIdAndUpdate(wallet._id, walletUpdate, { new: true });
    }

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

//     const withdrawal = await Withdrawals.findById(withdrawalId).populate("user");
//     if (!withdrawal) {
//       return res.status(404).json({
//         success: false,
//         message: "Withdrawal request not found.",
//       });
//     }

//     const user = withdrawal.user;
//     const wallet = await Wallet.findOne({ userId: user._id, adminId: withdrawal.adminId });
//     if (!wallet) {
//       return res.status(404).json({ success: false, message: "User wallet not found." });
//     }

//     // Validation for COMPLETED using wallet.pendingAmount
//     if (status === "COMPLETED" && (!wallet.pendingAmount || wallet.pendingAmount <= 0)) {
//       return res.status(400).json({
//         success: false,
//         message: "Cannot complete withdrawal. User has no pending payout amount.",
//       });
//     }

//     // Update withdrawal status and reject reason
//     const updatedWithdrawal = await Withdrawals.findByIdAndUpdate(
//       withdrawalId,
//       {
//         $set: {
//           status,
//           rejectReason: status === "REJECTED" ? rejectReason || "No reason provided" : "",
//         },
//       },
//       { new: true, runValidators: false }
//     ).populate("user");

//     if (!updatedWithdrawal) {
//       return res.status(404).json({ success: false, message: "Withdrawal not found after update." });
//     }

//     // Prepare wallet updates
//     let walletUpdate = {};

//     if (status === "CANCELLED") {
//       walletUpdate = {
//         $inc: { balanceAmount: withdrawal.requestedAmount || 0 },
//         $set: { pendingAmount: 0 },
//       };

//       await addHistory(
//         user._id,
//         UserActionEnum.WITHDRAWAL_CANCELLED,
//         withdrawal.requestedAmount,
//         UserCategoryEnum.PAYOUT,
//         { method: withdrawal.paymentMethod }
//       );
//     }

//     if (status === "COMPLETED") {
//       const withdrawalAmount = withdrawal.withdrawalAmount || 0;
//       walletUpdate = {
//         $inc: { totalAmount: withdrawalAmount, paidAmount: withdrawalAmount },
//         $set: { pendingAmount: 0 },
//       };

//       await addHistory(
//         user._id,
//         UserActionEnum.WITHDRAWAL_COMPLETED,
//         withdrawalAmount,
//         UserCategoryEnum.PAYOUT,
//         { method: withdrawal.paymentMethod, balanceBefore: withdrawal.balanceBefore, balanceAfter: withdrawal.balanceAfter }
//       );
//     }

//     if (status === "REJECTED") {
//       walletUpdate = { $set: { pendingAmount: 0 } };

//       await addHistory(
//         user._id,
//         UserActionEnum.WITHDRAWAL_REJECT,
//         withdrawal.withdrawalAmount,
//         UserCategoryEnum.PAYOUT,
//         { method: withdrawal.paymentMethod, reason: rejectReason || "No reason provided" }
//       );
//     }

//     // Apply wallet update if any
//     if (Object.keys(walletUpdate).length > 0) {
//       await Wallet.findByIdAndUpdate(wallet._id, walletUpdate, { new: true });
//     }

//     return res.status(200).json({
//       success: true,
//       message: `Withdrawal status updated to ${status}`,
//       data: updatedWithdrawal,
//     });
//   } catch (error) {
//     console.error("❌ Error updating withdrawal status:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while updating withdrawal status.",
//       error: error.message,
//     });
//   }
// };
// ===================================
// export const updateAffWithdrawalStatus = async (req, res) => {
//   try {
//     const { withdrawalId, status, rejectReason } = req.body;

//     // ------------------ 🧾 Basic Validation ------------------
//     if (!withdrawalId || !status) {
//       return res.status(400).json({
//         success: false,
//         message: "Withdrawal ID and status are required.",
//       });
//     }

//     // ------------------ 🔍 Fetch Withdrawal ------------------
//     const withdrawal = await Withdrawals.findById(withdrawalId).populate(
//       "user"
//     );
//     if (!withdrawal) {
//       return res.status(404).json({
//         success: false,
//         message: "Withdrawal request not found.",
//       });
//     }

//     const user = withdrawal.user;

//     // ------------------ ⚠️ Validate User Balance ------------------
//     if (
//       status === "COMPLETED" &&
//       (!user.payouts || user.payouts.pendingAmount <= 0)
//     ) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Cannot complete withdrawal. User has no pending payout amount.",
//       });
//     }

//     // ------------------ 🧩 Prepare Update Fields ------------------
//     const updateFields = {
//       status,
//       rejectReason:
//         status === "REJECTED" ? rejectReason || "No reason provided" : "",
//     };

//     // ------------------ 🛠️ Update Withdrawal ------------------
//     const updatedWithdrawal = await Withdrawals.findByIdAndUpdate(
//       withdrawalId,
//       { $set: updateFields },
//       { new: true, runValidators: false }
//     ).populate("user");

//     if (!updatedWithdrawal) {
//       return res.status(404).json({
//         success: false,
//         message: "Withdrawal not found after update.",
//       });
//     }

//     // ------------------ ❌ Handle Rejected Withdrawal ------------------
//     if (status === "REJECTED") {
//       await AffUser.findByIdAndUpdate(
//         user._id,
//         { $set: { "payouts.pendingAmount": 0 } },
//         { new: true }
//       );

//       await addHistory(
//         user._id,
//         UserActionEnum.WITHDRAWAL_REJECT,
//         withdrawal.withdrawalAmount,
//         UserCategoryEnum.PAYOUT,
//         {
//           method: withdrawal.paymentMethod,
//           reason: updateFields.rejectReason,
//         }
//       );
//     }

//     // ------------------ ✅ Handle Completed Withdrawal ------------------
//     if (status === "COMPLETED") {
//       const { withdrawalAmount, balanceBefore, balanceAfter, paymentMethod } =
//         updatedWithdrawal;

//       await addHistory(
//         user._id,
//         UserActionEnum.WITHDRAWAL_COMPLETED,
//         withdrawalAmount,
//         UserCategoryEnum.PAYOUT,
//         { method: paymentMethod, balanceBefore, balanceAfter }
//       );

//       await AffUser.findByIdAndUpdate(
//         user._id,
//         {
//           $inc: {
//             "payouts.paidAmount": withdrawalAmount,
//           },
//           $set: {
//             "payouts.pendingAmount": 0,
//           },
//         },
//         { new: true }
//       );
//     }

//     // ------------------ 🟢 Success Response ------------------
//     return res.status(200).json({
//       success: true,
//       message: `Withdrawal status updated to ${status}`,
//       data: updatedWithdrawal,
//     });
//   } catch (error) {
//     console.error("❌ Error updating withdrawal status:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while updating withdrawal status.",
//       error: error.message,
//     });
//   }
// };

export const processWithdrawal = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const userId = req.user._id;
    const { amount, withdrawalPin, method } = req.body;

    if (!adminId || !userId || !amount || !withdrawalPin || !method) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // 🔹 Fetch user
    const user = await AffUser.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // 🔹 Validate withdrawal PIN
    const isPinValid = await bcrypt.compare(
      withdrawalPin,
      user.withdrawalDetails.withdrawalPin || ""
    );
    if (!isPinValid)
      return res
        .status(403)
        .json({ success: false, message: "Invalid withdrawal PIN" });

    // 🔹 Fetch wallet
    const wallet = await Wallet.findOne({ userId, adminId });
    if (!wallet)
      return res
        .status(404)
        .json({ success: false, message: "Wallet not found" });

    if (wallet.balanceAmount < amount)
      return res
        .status(400)
        .json({ success: false, message: "Insufficient balance" });

    if (wallet.pendingAmount > 0)
      return res
        .status(400)
        .json({
          success: false,
          message: "You already have a pending withdrawal",
        });

    // 🔹 Fetch platform settings
    const platform = await Platform.findOne({ adminId });
    if (!platform)
      return res
        .status(404)
        .json({ success: false, message: "Platform settings not found" });

    // 🔹 Compute final amount after transfer charges
    let finalAmount = amount;
    if (method === "BANK" && platform.bankTransfer.enabled) {
      if (platform.bankTransfer.amountType === "FIXED")
        finalAmount -= platform.bankTransfer.transferCharge;
      else if (platform.bankTransfer.amountType === "PERCENT")
        finalAmount -=
          (finalAmount * platform.bankTransfer.transferCharge) / 100;
    }

    if (method === "ONLINE" && platform.onlineTransfer.enabled) {
      if (platform.onlineTransfer.amountType === "FIXED")
        finalAmount -= platform.onlineTransfer.transferCharge;
      else if (platform.onlineTransfer.amountType === "PERCENT")
        finalAmount -=
          (finalAmount * platform.onlineTransfer.transferCharge) / 100;
    }

    // 🔹 Update wallet balance
    const balanceBefore = wallet.balanceAmount;
    wallet.balanceAmount -= amount;
    wallet.pendingAmount += finalAmount;
    await wallet.save();

    // 🔹 Prepare withdrawal data
    const withdrawalData = {
      user: userId,
      adminId,
      paymentMethod: method,
      withdrawalAmount: finalAmount,
      requestedAmount: amount,
      transferCharge: amount - finalAmount,
      balanceBefore,
      balanceAfter: wallet.balanceAmount,
      status: "PENDING",
      tdsAmount: 0,
    };

    // 🔹 Set online payment method info
    if (method === "ONLINE") {
      withdrawalData.onlineMethod = {
        method: user.transactionDetails.method,
        upiId: user.transactionDetails.upiId,
        bank: user.transactionDetails.OnlineBank,
      };

      // Detect which payment type (UPI or BANK)
      const methodKey =
        user.transactionDetails.method === "UPI" ? "upi" : "bank";
      let contactId = user.razorpayAccounts?.[methodKey]?.contactId;
      let fundAccountId = user.razorpayAccounts?.[methodKey]?.fundAccountId;
      const isUpdated = user.razorpayAccounts?.[methodKey]?.isUpdated;

      // ✅ Create new contact/fund if missing or marked updated
      if (!contactId || !fundAccountId || isUpdated) {
        const result = await createRazorpayContactAndFund(user, methodKey);
        contactId = result.contactId;
        fundAccountId = result.fundAccountId;

        // ✅ Save in user schema
        user.razorpayAccounts[methodKey] = {
          contactId,
          fundAccountId,
          isUpdated: false, // reset after successful creation
        };
        await user.save();
      }

      // ✅ Save IDs into withdrawal record
      withdrawalData.razorpayContactId = contactId;
      withdrawalData.razorpayFundAccountId = fundAccountId;
    }

    const withdrawal = await Withdrawals.create(withdrawalData);

    // 🔹 Add to history
    await addHistory({
      userId,
      action: "WITHDRAWAL_REQUEST",
      amount: finalAmount,
      category: UserCategoryEnum.PAYOUT,
      metadata: {
        method,
        balanceBefore,
        balanceAfter: wallet.balanceAmount,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Withdrawal request successful via ${method}`,
      data: {
        withdrawal,
        wallet: {
          balanceAmount: wallet.balanceAmount,
          pendingAmount: wallet.pendingAmount,
          paidAmount: wallet.paidAmount,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error processing withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing withdrawal",
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

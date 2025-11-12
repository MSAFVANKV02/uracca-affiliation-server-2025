import { Commissions } from "../../models/commissionSchema.js";
import { Wallet } from "../../models/walletSchema.js";
import {
  AlreadyReportedError,
  BadRequestError,
  MissingFieldError,
  NotFoundError,
} from "../../utils/errors.js";

/**
 * Get all wallets
 */
export const getAllWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find()
      .populate("userId", "userName email")
      .populate("adminId", "userName email");
    return res.status(200).json(wallets);
  } catch (err) {
    console.error("❌ Error fetching all wallets:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get all wallets for a specific admin
 */
export const getAdminWallets = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({ message: "Admin ID is required" });
    }

    const wallets = await Wallet.find({ adminId })
      .populate("userId", "userName email")
      .populate("adminId", "userName email");
    return res.status(200).json(wallets);
  } catch (err) {
    console.error("❌ Error fetching admin wallets:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get wallet for a specific user + admin
 */
export const getUserAdminWallet = async (req, res) => {
  try {
    const { userId, adminId } = req.params;
    if (!userId || !adminId) {
      return res
        .status(400)
        .json({ message: "User ID and Admin ID are required" });
    }

    const wallet = await Wallet.findOne({ userId, adminId })
      .populate("userId", "userName email")
      .populate("adminId", "userName email");

    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    return res.status(200).json({
      data: wallet,
      message: "User wallet fetched successfully",
    });
  } catch (err) {
    console.error("❌ Error fetching user wallet:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ----------------------------------------------------------------
// 🧩 Step : cancel commission amount when order cancel / return
// ----------------------------------------------------------------

export const cancelWalletCommissionAmountFromAff = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      throw new MissingFieldError("Order Id is missing");
    }

    const commission = await Commissions.findOne({ orderId });

    if (!commission) {
      throw new NotFoundError("Commission not found for given order ID");
    }

    const wallet = await Wallet.findOne({ userId: commission.userId });

    if (!wallet) {
      throw new NotFoundError("Wallet not found for given order ID");
    }

    if ((commission.status = "CANCELLED")) {
      throw new AlreadyReportedError(
        "This commission has been already cancelled"
      );
    }

    // 3️⃣ Only proceed if commission is PAID
    if (commission.status === "PAID") {
      const deductionAmount = commission.finalCommission ?? 0;
      // ✅ update wallet balance and log a transaction
      wallet.balanceAmount = Math.max(
        0,
        wallet.balanceAmount - deductionAmount
      );
      wallet.cancelledAmount += deductionAmount;

      wallet.transactions.push({
        type: "COMMISSION",
        refId: commission._id,
        amount: -deductionAmount,
        status: "CANCELLED",
        createdAt: new Date(),
      });

      await wallet.save();

      // console.log(wallet);
      // console.log(commission);
      // ✅ update commission status
      commission.status = "CANCELLED";
      await commission.save();

      return res.status(200).json({
        success: true,
        message: `Commission cancelled and ${deductionAmount} deducted from wallet.`,
      });
    } else {
      commission.status = "CANCELLED";
      await commission.save();
      // Commission is not PAID
      return res.status(200).json({
        success: false,
        message: "commission cancelled with this orderId ",
      });
    }
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------------------------------
// 🧩 Step : recharge wallet
// ----------------------------------------------------------------

export const rechargeUserWallet = async (req, res, next) => {
  try {
    // const userId = req.user._id;
    const adminId = req.params.adminId;
    const userId = req.params.userId;

    const { amount, type } = req.body;

    if (!amount || amount <= 0) {
      throw new BadRequestError("Recharge amount must be greater than 0");
    }

    const wallet = await Wallet.findOne({ userId, adminId });

    if (!wallet) {
      throw new NotFoundError("Wallet not found");
    }

    // ✅ Update recharge details
    wallet.recharge = {
      rechargeAmount: amount,
      type: type || "LOCAL",
      date: new Date().toISOString(),
    };

    // ✅ Add to balanceAmount
    wallet.balanceAmount += Number(amount);

    // ✅ Optionally add a transaction record
    wallet.transactions.push({
      type: "RECHARGE", // or "RECHARGE" if you add it to enum
      amount,
      status: "PAID",
      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(200).json({
      success: true,
      message: "Wallet recharged successfully",
      wallet,
    });
  } catch (err) {
    // console.error("💥 rechargeUserWallet error:", err);
    next(err);
  }
};

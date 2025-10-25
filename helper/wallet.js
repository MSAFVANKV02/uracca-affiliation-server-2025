import { Wallet } from "../models/walletSchema.js";


/**
 * Add commission to user's wallet for a specific admin
 */
export const addCommissionToWallet = async ({ userId, adminId, commissionRecord }) => {
  const { finalCommission, tdsAmount, _id } = commissionRecord;

  const wallet = await Wallet.findOneAndUpdate(
    { userId, adminId },
    {
      $inc: {
        // totalAmount: finalCommission,
        // pendingAmount: finalCommission,
        commissionAmount: finalCommission,
        balanceAmount: finalCommission, // available for withdrawal after payout
      },
      $push: {
        transactions: {
          type: "COMMISSION",
          refId: _id,
          amount: finalCommission,
          tdsAmount,
          status: "PENDING",
        },
      },
    },
    { upsert: true, new: true }
  );

  return wallet;
};

/**
 * Mark a commission as paid in wallet
 */
export const markCommissionPaid = async ({ userId, adminId, commissionId }) => {
  const wallet = await Wallet.findOne({ userId, adminId });
  if (!wallet) throw new Error("Wallet not found");

  let txn = wallet.transactions.find(t => t.refId.toString() === commissionId.toString());
  if (!txn) throw new Error("Transaction not found");

  if (txn.status !== "PAID") {
    txn.status = "PAID";
    wallet.pendingAmount -= txn.amount;
    wallet.paidAmount += txn.amount;
    await wallet.save();
  }

  return wallet;
};

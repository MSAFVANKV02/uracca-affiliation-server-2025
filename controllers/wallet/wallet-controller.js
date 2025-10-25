import { Wallet } from "../../models/walletSchema.js";

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

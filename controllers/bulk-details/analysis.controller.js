import AffUser from "../../models/aff-user.js";
import { Campaign } from "../../models/campaignSchema.js";
import { Commissions } from "../../models/commissionSchema.js";
import { Transaction } from "../../models/transactionSchema.js";
import { Wallet } from "../../models/walletSchema.js";
import Withdrawals from "../../models/withdrawalSchema.js";
import { encryptData } from "../../utils/cript-data.js";
import { clean } from "../../helper/json-cleaner.js";
import DailyAction from "../../models/actionSchema.js";


export const getAffiliatePerformanceTable = async (req, res, next) => {
    try {
      const adminId = req.admin._id;
  
      /* --------------------------------------------------
         1️⃣ GET ADMIN WITH COLLABORATORS
      -------------------------------------------------- */
      const admin = await AffUser.findById(adminId)
        .select("collaborateWith")
        .lean();
  
      if (!admin?.collaborateWith?.length) {
        return res.status(200).json({
          success: true,
          data: encryptData([]),
        });
      }
  
      const collaboratorIds = admin.collaborateWith
        .filter(c => c.status === "ACCEPTED")
        .map(c => c.accountId);
  
      if (!collaboratorIds.length) {
        return res.status(200).json({
          success: true,
          data: encryptData([]),
        });
      }
  
      /* --------------------------------------------------
         2️⃣ FETCH COLLABORATOR USER DETAILS
      -------------------------------------------------- */
      const collaborators = await AffUser.find({
        _id: { $in: collaboratorIds },
      })
        .select( "_id referralId fullName userName email avatar social status")
        .lean();
  
      /* --------------------------------------------------
         3️⃣ AGGREGATE DAILY ACTIONS
      -------------------------------------------------- */
      const actions = await DailyAction.aggregate([
        {
          $match: {
            adminId,
            userId: { $in: collaboratorIds },
          },
        },
        {
          $group: {
            _id: "$userId",
            totalClicks: { $sum: "$clicks" },
            conversions: { $sum: "$orders" },
            earnings: { $sum: "$earnings" },
            commissionPaid: { $sum: "$paidCommission" },
          },
        },
      ]);
  
      const actionMap = new Map(
        actions.map(a => [a._id.toString(), a])
      );
  
      /* --------------------------------------------------
         4️⃣ BUILD TABLE ROWS (NO ADMIN)
      -------------------------------------------------- */
      const tableData = collaborators.map(user => {
        const stats = actionMap.get(user._id.toString()) || {};
  
        return {
        //   userId: user._id,
        //   referralId: user.referralId,
        //   affiliateName: user.fullName || user.userName,
        //   socialMediaHandle:
        //     user.social?.instagram ||
        //     user.social?.youtube ||
        //     user.social?.facebook ||
        //     "-",
        user: {
            _id: user._id,
            referralId: user.referralId,
            fullName: user.fullName,
            userName: user.userName,
            email: user.email,
            avatar: user.avatar,
            social: user.social,
          },
          totalClicks: stats.totalClicks || 0,
          conversions: stats.conversions || 0,
          earnings: stats.earnings || 0,
          commissionPaid: stats.commissionPaid || 0,
          status:user.status,
        };
      });
  
      return res.status(200).json({
        success: true,
        data: encryptData(tableData),
      });
    } catch (error) {
      next(error);
    }
  };

export const getAdminAnalysis = async (req, res, next) => {
  try {
    const adminId = req.admin?._id;
    if (!adminId) throw new NotFoundError("Admin not detected");

    /* --------------------------------------------------
         1️⃣ ADMIN BASIC INFO
      -------------------------------------------------- */
    const admin = await AffUser.findById(adminId)
      .select("userName fullName email userType referralId")
      .lean();

    /* --------------------------------------------------
         2️⃣ WALLET
      -------------------------------------------------- */
    const wallet = await Wallet.findOne({ adminId }).lean();

    /* --------------------------------------------------
         3️⃣ COMMISSIONS AGGREGATION
      -------------------------------------------------- */
    const commissionAgg = await Commissions.aggregate([
      { $match: { adminId } },
      {
        $group: {
          _id: "$status",
          amount: { $sum: "$finalCommission" },
          tds: { $sum: "$tdsAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const commissionSummary = {
      totalCount: 0,
      pendingAmount: 0,
      paidAmount: 0,
      cancelledAmount: 0,
      holdAmount: 0,
      totalTds: 0,
      finalCommission: 0,
    };

    commissionAgg.forEach((c) => {
      commissionSummary.totalCount += c.count;
      commissionSummary.totalTds += c.tds;
      commissionSummary.finalCommission += c.amount;

      if (c._id === "PENDING") commissionSummary.pendingAmount = c.amount;
      if (c._id === "PAID") commissionSummary.paidAmount = c.amount;
      if (c._id === "CANCELLED") commissionSummary.cancelledAmount = c.amount;
      if (c._id === "HOLD") commissionSummary.holdAmount = c.amount;
    });

    const recentCommissions = await Commissions.find({ adminId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    /* --------------------------------------------------
         4️⃣ TRANSACTIONS
      -------------------------------------------------- */
    const transactions = await Transaction.find({
      walletId: wallet?._id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const transactionSummary = {
      totalWithdrawals: 0,
      totalRecharges: 0,
      totalRefunds: 0,
    };

    transactions.forEach((t) => {
      if (t.type === "WITHDRAWAL")
        transactionSummary.totalWithdrawals += t.amount;
      if (t.type === "RECHARGE") transactionSummary.totalRecharges += t.amount;
      if (t.type === "REFUND") transactionSummary.totalRefunds += t.amount;
    });

    /* --------------------------------------------------
         5️⃣ CAMPAIGNS
      -------------------------------------------------- */
    const campaignAgg = await Campaign.aggregate([
      { $match: { "company.accountId": adminId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          activeCampaigns: {
            $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] },
          },
          totalClicks: { $sum: "$clicks" },
          totalOrders: { $sum: "$ordersCount" },
          totalSales: { $sum: "$commissionDetails.totalCommissionWithTds" },
          totalCommission: { $sum: "$commissionDetails.totalCommission" },
        },
      },
    ]);

    /* --------------------------------------------------
         6️⃣ FINAL RESPONSE
      -------------------------------------------------- */
    const payload = clean({
      admin,

      wallet: wallet
        ? {
            totals: {
              totalAmount: wallet.totalAmount,
              pendingAmount: wallet.pendingAmount,
              paidAmount: wallet.paidAmount,
              cancelledAmount: wallet.cancelledAmount,
              commissionAmount: wallet.commissionAmount,
              balanceAmount: wallet.balanceAmount,
            },
            lastRecharge: wallet.recharge,
            lastTransaction: wallet.transactions?.[0],
          }
        : null,

      commissions: {
        summary: commissionSummary,
        recent: recentCommissions,
      },

      transactions: {
        summary: transactionSummary,
        recent: transactions,
      },

      campaigns: campaignAgg?.[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalClicks: 0,
        totalOrders: 0,
        totalSales: 0,
        totalCommission: 0,
      },

      insights: {
        withdrawableBalance: wallet?.balanceAmount || 0,
        blockedAmount: commissionSummary.holdAmount,
        lifetimeEarnings: commissionSummary.finalCommission,
      },
    });

    return res.status(200).json({
      success: true,
      data: encryptData(payload),
    });
  } catch (error) {
    next(error);
  }
};

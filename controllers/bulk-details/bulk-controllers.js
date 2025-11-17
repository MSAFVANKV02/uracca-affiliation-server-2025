// controllers/adminDashboardController.js

import axios from "axios";
import AffUser from "../../models/aff-user.js";
import { Campaign } from "../../models/campaignSchema.js";
import { Commissions } from "../../models/commissionSchema.js";
import Domains from "../../models/domainSchema.js";
import { Platform } from "../../models/platformSchema.js";
import { Product } from "../../models/productSchema.js";
import { Wallet } from "../../models/walletSchema.js";
import Withdrawals from "../../models/withdrawalSchema.js";
import { encryptData } from "../../utils/cript-data.js";
import { clean } from "../../helper/json-cleaner.js";
import DailyAction from "../../models/actionSchema.js";

export const bulkDataController = async (req, res, next) => {
  try {
    const adminId = req.admin._id;

    // 1️⃣ Get Users under this admin
    // const users = await AffUser.find({ workingOn: adminId })
    //   .select("fullName email mobile referralId status commissionDetails actions social documents");
    // 1️⃣ Get Users under this admin using collaborateWith
    const users = await AffUser.find({
      collaborateWith: {
        $elemMatch: { accountId: adminId },
      },
    }).select(
      "fullName email mobile referralId status workingOn commissionDetails actions social documents collaborateWith"
    );

    const currentAdmin = await AffUser.findById({ _id: adminId });

    const userIds = users.map((u) => u._id);

    // 2️⃣ Get Wallets for these users
    const wallets = await Wallet.find({ adminId }).populate(
      "userId",
      "fullName email"
    );

    // 3️⃣ Get Campaigns managed by this admin
    const campaigns = await Campaign.find({ "company.accountId": adminId })
      .populate("userId", "fullName email")
      .populate("product.productId", "productName mrp category");

    // 4️⃣ Get Commissions for this admin
    const commissions = await Commissions.find({ adminId })
      .populate("userId", "fullName email")
      .populate("campaignId", "campaignLink");

    // 5️⃣ Get Withdrawals for this admin
    const withdrawals = await Withdrawals.find({ adminId }).populate(
      "user",
      "fullName email"
    );

    // 6️⃣ Get Products under admin's domain and merge with external products
    let products = [];

    // Fetch platform to get external product URL
    const platform = await Platform.findOne({ adminId });
    const productsUrl = platform?.backendRoutes?.products;

    if (productsUrl) {
      // Fetch external products
      const externalResponse = await axios.get(productsUrl, {
        withCredentials: true,
      });
      const externalProducts = externalResponse.data || [];

      // Get internal products for this admin's domain
      const adminDomain = await Domains.findOne({ registeredUserId: adminId });
      const internalProducts = adminDomain
        ? await Product.find({ domain: adminDomain.url, isActive: true })
        : [];

      // Convert internal products to a map for fast lookup
      const internalProductsMap = new Map();
      internalProducts.forEach((p) => internalProductsMap.set(p.productId, p));

      // Merge: if internal exists, take it; else take external
      products = externalProducts.map((extProd) => {
        if (internalProductsMap.has(extProd.productId)) {
          return internalProductsMap.get(extProd.productId);
        }
        return extProd;
      });

      // Add any internal products not in external
      internalProducts.forEach((p) => {
        if (!products.find((prod) => prod.productId === p.productId)) {
          products.push(p);
        }
      });

      // Remove any products marked inactive (extra safety)
      products = products.filter((p) => p.isActive !== false);
    }

    // 7️⃣ Aggregated Totals for commissions
    const commissionDetails = {
      totalCommission: commissions.reduce(
        (acc, c) => acc + c.commissionAmount,
        0
      ),
      totalPending: commissions
        .filter((c) => c.status === "PENDING")
        .reduce((acc, c) => acc + c.commissionAmount, 0),
      totalPaid: commissions
        .filter((c) => c.status === "PAID")
        .reduce((acc, c) => acc + c.commissionAmount, 0),
      totalCancelled: commissions
        .filter((c) => c.status === "CANCELLED")
        .reduce((acc, c) => acc + c.commissionAmount, 0),
      totalTds: commissions.reduce((acc, c) => acc + (c.tdsAmount || 0), 0),
      totalFinalCommission: commissions.reduce(
        (acc, c) => acc + (c.finalCommission || 0),
        0
      ),
    };

    // </ -------------  Conversion Stats ------------- >
    // const totalConversions = await Commissions.countDocuments({ adminId: adminId });
    const totalConversions = commissions.length;
    const successfulConversions = commissions.filter(
      (c) => c.status === "PAID"
    ).length;
    const totalClicks = users.reduce(
      (acc, u) => acc + (u.actions?.totalClicks || 0),
      0
    );
    const conversionRate =
      totalClicks > 0 ? (successfulConversions / totalClicks) * 100 : 0;

    // const successfulConversions = await Commissions.countDocuments({
    //     adminId: adminId,
    //     status: "PAID" // or "COMPLETED" depending on your system
    //   });
    // const userConversions = await Commissions.aggregate([
    //     { $match: { adminId: adminId } },
    //     { $group: { _id: "$userId", conversions: { $sum: 1 } } }
    //   ]);

    // </ -------------  Conversion Stats ------------- >

    // 7️⃣ Aggregated Totals
    const totalWallet = wallets.reduce((acc, w) => acc + w.totalAmount, 0);
    const balanceAmount = wallets.reduce((acc, w) => acc + w.balanceAmount, 0);
    const totalPending = wallets.reduce((acc, w) => acc + w.pendingAmount, 0);
    const totalPaid = wallets.reduce((acc, w) => acc + w.paidAmount, 0);

    const totalCampaigns = campaigns.length;
    const totalUsers = currentAdmin.collaborateWith.length;
    const approvedUsers = users.filter((u) => u.status === "APPROVED").length;
    const pendingApplications = users.filter(
      (u) => u.status === "PENDING"
    ).length;

    // users.forEach(u => {
    //     console.log(
    //       `Checking active user: ${u.fullName} workingOn: ${u.workingOn} adminId: ${adminId}`
    //     );
    //   });

    const activeUsers = users.filter(
      (u) => u.workingOn && u.workingOn.toString() === adminId.toString()
    ).length;

    // console.log(`${activeUsers} users are active under admin`);

    const totalProducts = products.length;

    // Sort users by total earned commission (highest first)
    const userCommissionMap = commissions.reduce((acc, c) => {
      const userId = c.userId?._id?.toString() || c.userId?.toString();
      if (!userId) return acc;
      acc[userId] =
        (acc[userId] || 0) + (c.finalCommission || c.commissionAmount || 0);
      return acc;
    }, {});

    users.sort((a, b) => {
      const aTotal = userCommissionMap[a._id.toString()] || 0;
      const bTotal = userCommissionMap[b._id.toString()] || 0;
      return bTotal - aTotal; // descending order
    });

    // 🟢 CLEAN ALL DATA before encrypting
    const safePayload = clean({
      summary: {
        totalUsers,
        pendingApplications,
        totalCampaigns,
        totalProducts,
        totalWallet,
        balanceAmount,
        totalPending,
        totalPaid,
        approvedUsers,
        activeUsers,
        totalConversions,
        conversionRate,
        commissionDetails,
      },
      users,
      wallets,
      campaigns,
      commissions,
      withdrawals,
      products,
    });

    // 🟢 ENCRYPT
    const encryptedData = encryptData(safePayload);

    res.status(200).json({
      success: true,
      data: encryptedData,
      // data: {
      //   summary: {
      //     totalUsers,
      //     pendingApplications,
      //     totalCampaigns,
      //     totalProducts,
      //     totalWallet,
      //     balanceAmount,
      //     totalPending,
      //     totalPaid,
      //     approvedUsers,
      //     activeUsers,
      //     totalConversions,
      //     conversionRate,
      //     commissionDetails,
      //   },
      //   users,
      //   wallets,
      //   campaigns,
      //   commissions,
      //   withdrawals,
      //   products,
      // },
    });
  } catch (error) {
    console.error("Error fetching bulk admin data:", error);
    next(error)
    // res.status(500).json({
    //   success: false,
    //   message: "Server error fetching admin dashboard data",
    // });
  }
};

/**
 * Get earning + conversion chart data (daily / monthly / yearly)
 * Returns totals + chart datasets for line/bar graphs
 */
export const getEarningChartDataController = async (req, res) => {
  try {
    const adminId = req.admin._id;
    const { filter = "monthly" } = req.query;

    const now = new Date();
    let startDate, groupFormat;

    switch (filter) {
      case "daily":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // last 7 days
        groupFormat = { day: "2-digit", month: "short" };
        break;
      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30); // last 4 weeks
        groupFormat = { day: "2-digit", month: "short" };
        break;
      case "monthly":
        startDate = new Date(now.getFullYear(), 0, 1); // start of year
        groupFormat = { month: "short" };
        break;
      case "yearly":
        startDate = new Date(now.getFullYear() - 4, 0, 1); // last 5 years
        groupFormat = { year: "numeric" };
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = { month: "short" };
    }

    // 🧾 Fetch commissions
    const commissions = await Commissions.find({
      adminId,
      createdAt: { $gte: startDate, $lte: now },
    }).populate("userId", "fullName");

    // 🧩 Build empty buckets for full period
    const buckets = {};

    if (filter === "daily") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString("en-US", groupFormat);
        buckets[label] = { label, totalCommission: 0, totalConversions: 0 };
      }
    } else if (filter === "weekly") {
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i * 7);
        const label = `Week ${5 - i}`; // you can use a proper week number if needed
        buckets[label] = { label, totalCommission: 0, totalConversions: 0 };
      }
    } else if (filter === "monthly") {
      for (let m = 0; m < 12; m++) {
        const label = new Date(now.getFullYear(), m).toLocaleString("en-US", {
          month: "short",
        });
        buckets[label] = { label, totalCommission: 0, totalConversions: 0 };
      }
    } else if (filter === "yearly") {
      for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
        buckets[y.toString()] = {
          label: y.toString(),
          totalCommission: 0,
          totalConversions: 0,
        };
      }
    }

    // 🧩 Fill buckets with actual commission data
    for (const c of commissions) {
      const date = new Date(c.createdAt);
      let label;

      if (filter === "yearly") {
        label = date.getFullYear().toString();
      } else if (filter === "monthly") {
        label = date.toLocaleString("en-US", { month: "short" });
      } else if (filter === "weekly") {
        // simple 7-day grouping
        const weekIndex = Math.floor((now - date) / (7 * 24 * 60 * 60 * 1000));
        label = `Week ${Math.max(1, 5 - weekIndex)}`;
      } else {
        label = date.toLocaleDateString("en-US", groupFormat);
      }

      if (buckets[label]) {
        buckets[label].totalCommission +=
          c.finalCommission || c.commissionAmount || 0;
        buckets[label].totalConversions += 1;
      }
    }

    // 🧮 Convert buckets → chart array
    const chartData = Object.values(buckets);

    // 🧾 Summary
    const totalCommission = commissions.reduce(
      (acc, c) => acc + (c.finalCommission || c.commissionAmount || 0),
      0
    );
    const totalConversions = commissions.length;

    const users = await AffUser.find({
      collaborateWith: { $elemMatch: { accountId: adminId } },
    }).select("actions.totalClicks");

    const totalClicks = users.reduce(
      (acc, u) => acc + (u.actions?.totalClicks || 0),
      0
    );
    const successfulConversions = commissions.filter(
      (c) => c.status === "PAID"
    ).length;
    const conversionRate =
      totalClicks > 0 ? (successfulConversions / totalClicks) * 100 : 0;

    // 🧾 Compute earnings for today, week, month, year
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const todayEarnings = commissions
      .filter((c) => c.createdAt >= startOfToday)
      .reduce(
        (acc, c) => acc + (c.finalCommission || c.commissionAmount || 0),
        0
      );

    const thisWeekEarnings = commissions
      .filter((c) => c.createdAt >= startOfWeek)
      .reduce(
        (acc, c) => acc + (c.finalCommission || c.commissionAmount || 0),
        0
      );

    const thisMonthEarnings = commissions
      .filter((c) => c.createdAt >= startOfMonth)
      .reduce(
        (acc, c) => acc + (c.finalCommission || c.commissionAmount || 0),
        0
      );

    const thisYearEarnings = commissions
      .filter((c) => c.createdAt >= startOfYear)
      .reduce(
        (acc, c) => acc + (c.finalCommission || c.commissionAmount || 0),
        0
      );

    const safePayload = clean({
      summary: {
        totalCommission,
        totalConversions,
        conversionRate: conversionRate.toFixed(2),
        todayEarnings,
        thisWeekEarnings,
        thisMonthEarnings,
        thisYearEarnings,
      },
      chartData, // ✅ complete dataset for chart, with 0s where no data
    });

    // 🟢 ENCRYPT
    const encryptedData = encryptData(safePayload);

    res.status(200).json({
      success: true,
      data: encryptedData,
      //  {
      //   summary: {
      //     totalCommission,
      //     totalConversions,
      //     conversionRate: conversionRate.toFixed(2),
      //   todayEarnings,
      //   thisWeekEarnings,
      //   thisMonthEarnings,
      //   thisYearEarnings,
      //   },
      //   chartData, // ✅ complete dataset for chart, with 0s where no data
      // },
    });
  } catch (error) {
    console.error("Error fetching earning chart data:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching earning chart data",
    });
  }
};




// ====== user chart
export const getUserChartDataController = async (req, res) => {
  try {
    const userId = req.user._id;
    const adminId = req.user.workingOn;

    const { type = "revenue", period = "monthly" } = req.query;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "User does not have a working admin assigned.",
      });
    }

    const now = new Date();
    let startDate, groupFormat;

    // ⏳ Time grouping logic
    switch (period) {
      case "daily":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6);
        groupFormat = { day: "2-digit", month: "short" };
        break;

      case "weekly":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        groupFormat = { day: "2-digit", month: "short" };
        break;

      case "monthly":
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = { month: "short" };
        break;

      case "yearly":
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        groupFormat = { year: "numeric" };
        break;

      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = { month: "short" };
    }

    // ---------------------------------------
    // 🪙 TYPE: REVENUE  → Commissions Model
    // ---------------------------------------
    let rawData = [];

    if (type === "revenue") {
      rawData = await Commissions.find({
        userId,
        adminId,
        createdAt: { $gte: startDate, $lte: now },
      }).lean();
    }

    // ---------------------------------------
    // 🖱 TYPE: CLICKS → DailyActions Model
    // ---------------------------------------
    if (type === "clicks") {
      rawData = await DailyAction.find({
        userId,
        adminId,
        createdAt: { $gte: startDate, $lte: now },
      }).lean();
    }

    // ---------------------------------------
    // 🧩 Build Empty Buckets First
    // ---------------------------------------
    const buckets = {};

    if (period === "daily") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString("en-US", groupFormat);
        buckets[label] = { label, value: 0 };
      }
    }

    if (period === "weekly") {
      for (let i = 4; i >= 0; i--) {
        const label = `Week ${5 - i}`;
        buckets[label] = { label, value: 0 };
      }
    }

    if (period === "monthly") {
      for (let m = 0; m < 12; m++) {
        const label = new Date(now.getFullYear(), m).toLocaleString("en-US", {
          month: "short",
        });
        buckets[label] = { label, value: 0 };
      }
    }

    if (period === "yearly") {
      for (let y = now.getFullYear() - 4; y <= now.getFullYear(); y++) {
        buckets[y.toString()] = { label: y.toString(), value: 0 };
      }
    }

    // ---------------------------------------
    // 🔄 Fill Buckets with Real Values
    // ---------------------------------------
    for (const r of rawData) {
      const date = new Date(r.createdAt || r.date);

      let label;

      if (period === "yearly") {
        label = date.getFullYear().toString();
      } else if (period === "monthly") {
        label = date.toLocaleString("en-US", { month: "short" });
      } else if (period === "weekly") {
        const weekIndex = Math.floor(
          (now - date) / (7 * 24 * 60 * 60 * 1000)
        );
        label = `Week ${Math.max(1, 5 - weekIndex)}`;
      } else {
        label = date.toLocaleDateString("en-US", groupFormat);
      }

      if (!buckets[label]) continue;

      // Revenue
      if (type === "revenue") {
        buckets[label].value +=
          r.finalCommission || r.commissionAmount || 0;
      }

      // Clicks
      if (type === "clicks") {
        buckets[label].value += r.clicks || 0;
      }
    }

    const chartData = Object.values(buckets);

    // Encrypt & send
    const safePayload = clean({ chartData });
    const encrypted = encryptData(safePayload);

    res.status(200).json({
      success: true,
      data: encrypted,
    });
  } catch (error) {
    console.error("User chart error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user chart data",
    });
  }
};

// export const getEarningChartDataController = async (req, res) => {
//     try {
//       const adminId = req.admin._id;
//       const { filter = "monthly" } = req.query; // daily | weekly | monthly | yearly

//       const now = new Date();
//       let startDate;
//       let groupFormat; // How to format labels on the chart

//       // 🧮 Decide time range & grouping
//       switch (filter) {
//         case "daily":
//           startDate = new Date(now);
//           startDate.setDate(now.getDate() - 6); // last 7 days
//           groupFormat = { day: "2-digit", month: "short" }; // e.g. "25 Oct"
//           break;
//         case "weekly":
//           startDate = new Date(now);
//           startDate.setDate(now.getDate() - 30); // last 4 weeks
//           groupFormat = { day: "2-digit", month: "short" };
//           break;
//         case "monthly":
//           startDate = new Date(now.getFullYear(), 0, 1); // this year
//           groupFormat = { month: "short" }; // e.g. "Jan", "Feb"
//           break;
//         case "yearly":
//           startDate = new Date(now.getFullYear() - 5, 0, 1); // last 5 years
//           groupFormat = { year: "numeric" }; // e.g. "2021"
//           break;
//         default:
//           startDate = new Date(now.getFullYear(), 0, 1);
//           groupFormat = { month: "short" };
//       }

//       // 🧾 Fetch commissions for the admin
//       const commissions = await Commissions.find({
//         adminId,
//         createdAt: { $gte: startDate, $lte: now },
//       }).populate("userId", "fullName");

//       // Get clicks for conversion calculation
//       const users = await AffUser.find({
//         collaborateWith: { $elemMatch: { accountId: adminId } },
//       }).select("actions.totalClicks");

//       const totalClicks = users.reduce(
//         (acc, u) => acc + (u.actions?.totalClicks || 0),
//         0
//       );

//       // 🧩 Group commissions into buckets (based on filter)
//       const buckets = {};

//       for (const c of commissions) {
//         const date = new Date(c.createdAt);
//         let label;

//         if (filter === "yearly") {
//           label = date.getFullYear().toString();
//         } else if (filter === "monthly") {
//           label = date.toLocaleString("en-US", { month: "short" }); // "Jan"
//         } else {
//           label = date.toLocaleDateString("en-US", groupFormat); // "25 Oct"
//         }

//         if (!buckets[label]) {
//           buckets[label] = {
//             label,
//             totalCommission: 0,
//             totalConversions: 0,
//           };
//         }

//         buckets[label].totalCommission +=
//           c.finalCommission || c.commissionAmount || 0;
//         buckets[label].totalConversions += 1;
//       }

//       const trend = Object.values(buckets).sort((a, b) => {
//         if (filter === "yearly") return parseInt(a.label) - parseInt(b.label);
//         return new Date(a.label) - new Date(b.label);
//       });

//       // 🧮 Calculate totals
//       const totalCommission = commissions.reduce(
//         (acc, c) => acc + (c.finalCommission || c.commissionAmount || 0),
//         0
//       );
//       const totalConversions = commissions.length;
//       const successfulConversions = commissions.filter(
//         (c) => c.status === "PAID"
//       ).length;
//       const conversionRate =
//         totalClicks > 0 ? (successfulConversions / totalClicks) * 100 : 0;

//       // 📊 Chart-ready structure
//       const chartData = trend.map((t) => ({
//         name: t.label,
//         commission: parseFloat(t.totalCommission.toFixed(2)),
//         conversions: t.totalConversions,
//       }));

//       return res.status(200).json({
//         success: true,
//         data: {
//           summary: {
//             totalCommission,
//             totalConversions,
//             conversionRate: conversionRate.toFixed(2),
//           },
//           chartData, // ✅ usable directly for bar/line chart
//         },
//       });
//     } catch (error) {
//       console.error("Error fetching earning chart data:", error);
//       res.status(500).json({
//         success: false,
//         message: "Server error fetching earning chart data",
//       });
//     }
//   };

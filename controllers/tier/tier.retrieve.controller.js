import { clean } from "../../helper/json-cleaner.js";
import AffUser from "../../models/aff-user.js";
import { Platform } from "../../models/platformSchema.js";
import { TierRewardLog } from "../../models/tier-models/tierRewardLogsSchema.js";
import { Tier } from "../../models/tier-models/tierSystemSchema.js";
import { UserTierProgress } from "../../models/tier-models/tierUserProgressSchema.js";
import { encryptData } from "../../utils/cript-data.js";

// ================================================================ ///
// ================ GET ALL AFFILIATE TIER ========================= ///
// ================================================================ ///

export const getAllAffiliateTiersController = async (req, res, next) => {
  try {
    const admin = req.admin;

    // Fetch all tiers for the admin, sorted by 'order'
    const tiers = await Tier.find({ adminId: admin._id }).sort({ order: 1 });

    const encryptedTier = encryptData(tiers);

    return res.status(200).json({
      success: true,
      message: "Affiliate tiers fetched successfully",
      data: encryptedTier,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAffiliateTiersWithIdController = async (req, res, next) => {
  try {
    const admin = req.admin;
    const { tierId } = req.params;

    let tiers;

    // ==========================
    // GET SINGLE TIER BY ID
    // ==========================
    if (tierId) {
      const tier = await Tier.findOne({
        _id: tierId,
        adminId: admin._id,
      });

      if (!tier) {
        return res.status(404).json({
          success: false,
          message: "Tier not found",
          data: [],
        });
      }

      tiers = [tier]; // always return array to match frontend structure
    }

    // ==========================
    // GET ALL TIERS
    // ==========================
    else {
      tiers = await Tier.find({ adminId: admin._id }).sort({ order: 1 });
    }

    const encryptedTier = encryptData(tiers);

    return res.status(200).json({
      success: true,
      message: "Affiliate tiers fetched successfully",
      data: encryptedTier,
    });
  } catch (error) {
    next(error);
  }
};

// ================================================================ ///
// ================ GET USER AFFILIATE CURRENT TIER ========================= ///
// ================================================================ ///

export const getUserAffiliateCurrentTierController = async (req, res, next) => {
  try {
    const admin = req.admin;
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch the user's current tier progress
    const userTierProgress = await UserTierProgress.findOne({
      userId,
      adminId: admin._id,
    }).populate("currentTierId");

    if (!userTierProgress) {
      return res.status(404).json({ message: "User tier progress not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User's current affiliate tier fetched successfully",
      data: userTierProgress.currentTierId,
    });
  } catch (error) {
    next(error);
  }
};

// ================================================================ ///
// ================ GET USER AFFILIATE CURRENT TIER PROGRESS ====== ///
// ================================================================ ///

// export const getUserTierProgressController = async (req, res, next) => {
//   try {
//     const userId = req.user._id;

//     // 1️⃣ Validate user
//     const user = await AffUser.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const adminId = user.workingOn;

//     // 2️⃣ Get Admin & Platform
//     const admin = await AffUser.findById(adminId);
//     if (!admin) throw new Error("Admin not found");

//     const platformId = admin.platformId;

//     // 3️⃣ Get Progress Doc
//     const progress = await UserTierProgress.findOne({
//       userId,
//       adminId,
//       platformId,
//     });

//     if (!progress) {
//       return res.status(203).json({
//         success: false,
//         data: null,
//         message: "No tier progress found",
//       });
//     }

//     // 4️⃣ Fetch Current Tier
//     const tier = await Tier.findById(progress.currentTierId);
//     if (!tier) throw new Error("Tier not found for progress");

//     const currentLevel = tier.levels.find(
//       (l) => l.levelNumber === progress.currentLevel
//     );
//     if (!currentLevel) throw new Error("Current level not found in tier");

//     const goals = currentLevel.goals;

//     // 5️⃣ Build structured goal progress list
//     const goalData = goals.map((g) => {
//       const gp = progress.goalProgress.find(
//         (p) => p.goalId === g._id.toString()
//       );

//       return {
//         goalId: g._id.toString(),
//         goalType: g.goalType,
//         target: g.target,
//         progress: gp ? gp.progress : 0,
//         isCompleted: gp ? gp.isCompleted : false,
//       };
//     });

//     // 6️⃣ LEVEL PROGRESS = average completion of all goals in this level
//     let totalPercent = 0;

//     goals.forEach((g) => {
//       const gp = progress.goalProgress.find(
//         (p) => p.goalId === g._id.toString()
//       );
//       const current = gp ? gp.progress : 0;

//       if (g.target > 0) {
//         totalPercent += Math.min(current / g.target, 1);
//       } else {
//         totalPercent += 1; // Goal with no target counts as complete
//       }
//     });

//     // const totalGoals = goals.length || 1;
//     // const progressPercent = Math.round((totalPercent / totalGoals) * 100);

//     // // 🔥7️⃣ Dynamic Next Step (Next Level or Next Tier)
//     // const nextLevel = tier.levels.find(
//     //   (lvl) => lvl.levelNumber === currentLevel.levelNumber + 1
//     // );

//     // let nextStep = {
//     //   type: "",
//     //   value: "",
//     // };

//     // if (nextLevel) {
//     //   nextStep = {
//     //     type: "NEXT_LEVEL",
//     //     value: nextLevel.levelNumber, // e.g. Level 2
//     //   };
//     // } else {
//     //   // No next level → check next tier
//     //   const nextTier = await Tier.findOne({
//     //     adminId,
//     //     platformId,
//     //     order: tier.order + 1,
//     //     isActive: true,
//     //   });

//     //   if (nextTier) {
//     //     nextStep = {
//     //       type: "NEXT_TIER",
//     //       value: nextTier.tierName, // e.g. Silver Tier
//     //     };
//     //   } else {
//     //     nextStep = {
//     //       type: "COMPLETED_ALL",
//     //       value: null,
//     //     };
//     //   }
//     // }
//     // 6️⃣ LEVEL PROGRESS = average completion of all goals in this level
//     const totalGoals = goals.length || 1;
//     let progressPercent = Math.round((totalPercent / totalGoals) * 100);

//     // 🔥7️⃣ Dynamic Next Step (Next Level or Next Tier)
//     const nextLevel = tier.levels.find(
//       (lvl) => lvl.levelNumber === currentLevel.levelNumber + 1
//     );

//     let nextStep = { type: "", value: "" };

//     if (nextLevel) {
//       nextStep = {
//         type: "NEXT_LEVEL",
//         value: nextLevel.levelNumber,
//       };
//     } else {
//       const nextTier = await Tier.findOne({
//         adminId,
//         platformId,
//         order: tier.order + 1,
//         isActive: true,
//       });

//       if (nextTier) {
//         nextStep = {
//           type: "NEXT_TIER",
//           value: nextTier.tierName,
//         };
//       } else {
//         // ⭐ FINAL TIER + FINAL LEVEL → ALWAYS 100%
//         nextStep = {
//           type: "COMPLETED_ALL",
//           value: null,
//         };

//         progressPercent = 100; // 👈 FORCE FULL PROGRESS
//       }
//     }

//     // 8️⃣ Pending rewards
//     const pendingRewards = await TierRewardLog.find({
//       userId,
//       adminId,
//       platformId,
//       isClaimed: false,
//       action: "REWARD_EARNED",
//     }).lean();

//     // 9️⃣ Past rewards
//     const pastRewards = await TierRewardLog.find({
//       userId,
//       adminId,
//       platformId,
//       isClaimed: true,
//     })
//       .sort({ createdAt: -1 })
//       .lean();

//     // 🔐10️⃣ ENCRYPT RESPONSE
//     const safePayload = clean({
//       currentStatus: {
//         tierName: tier.tierName,
//         level: currentLevel.levelNumber,
//         currentTierLevel: tier.order, // IMPORTANT FOR ICONS
//         progressPercent,
//       },

//       nextStep, // 🚀 tells UI what text to show

//       levels: tier.levels,
//       goals: goalData,

//       pendingRewards,
//       upcomingRewards: nextLevel ? nextLevel.rewards : [],
//       pastRewards,

//       debug: {
//         currentTierId: progress.currentTierId,
//         currentLevel: progress.currentLevel,
//         goalProgress: progress.goalProgress,
//       },
//     });

//     const encryptedData = encryptData(safePayload);

//     return res.status(200).json({
//       success: true,
//       data: encryptedData,
//     });
//   } catch (err) {
//     console.error("Error fetching tier progress:", err);
//     next(err);
//   }
// };

// ================================================================ ///
// ================ GET USER AFFILIATE CURRENT TIER PROGRESS ====== ///
// ================================================================ ///

export const getUserTierProgressController = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1️⃣ Validate user
    const user = await AffUser.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const adminId = user.workingOn;

    // 2️⃣ Get Admin & Platform
    const admin = await AffUser.findById(adminId);
    if (!admin) throw new Error("Admin not found");

    const platformId = admin.platformId;

    // ============================================================
    // 🚀 NEW LOGIC: If no progress doc → create first tier progress
    // ============================================================
    let progress = await UserTierProgress.findOne({
      userId,
      adminId,
      platformId,
    });

    if (!progress) {
      // Find first tier for admin/platform
      const firstTier = await Tier.findOne({
        adminId,
        platformId,
        isActive: true,
      }).sort({ order: 1 });

      if (!firstTier) {
        return res.status(404).json({
          success: false,
          message: "No active tiers found for admin",
        });
      }

      // First active level
      const firstLevel =
        firstTier.levels.find((l) => l.isActive && l.levelNumber === 1) ||
        firstTier.levels.find((l) => l.isActive);

      if (!firstLevel) {
        return res.status(404).json({
          success: false,
          message: "Tier has no active levels",
        });
      }

      // Build goalProgress
      const goalProgress = firstLevel.goals.map((g) => ({
        goalId: g._id.toString(),
        goalType: g.goalType,
        target: g.target,
        progress: 0,
        isCompleted: false,
      }));

      // Create new progress record
      progress = await UserTierProgress.create({
        userId,
        adminId,
        platformId,
        currentTierId: firstTier._id,
        currentLevel: firstLevel.levelNumber,
        isTierCompleted: false,
        goalProgress,
      });
    }

    // 4️⃣ Fetch Current Tier
    const tier = await Tier.findById(progress.currentTierId);
    if (!tier) throw new Error("Tier not found for progress");

    const currentLevel = tier.levels.find(
      (l) => l.levelNumber === progress.currentLevel
    );
    if (!currentLevel) throw new Error("Current level not found in tier");

    // ⭐⭐⭐ IMPORTANT FIX — REBUILD goalProgress IF LEVEL CHANGED ⭐⭐⭐
    if (
      !progress.goalProgress ||
      progress.goalProgress.length !== currentLevel.goals.length ||
      !progress.goalProgress.every((pg) =>
        currentLevel.goals.some((g) => g._id.toString() === pg.goalId)
      )
    ) {
      progress.goalProgress = currentLevel.goals.map((g) => ({
        goalId: g._id.toString(),
        goalType: g.goalType,
        target: g.target,
        progress: 0,
        isCompleted: false,
      }));

      await progress.save();
    }
    // ⭐⭐⭐ END FIX ⭐⭐⭐

    const goals = currentLevel.goals;

    // 5️⃣ Build structured goal progress list
    const goalData = goals.map((g) => {
      const gp = progress.goalProgress.find(
        (p) => p.goalId === g._id.toString()
      );

      return {
        goalId: g._id.toString(),
        goalType: g.goalType,
        target: g.target,
        progress: gp ? gp.progress : 0,
        isCompleted: gp ? gp.isCompleted : false,
      };
    });

    // 6️⃣ LEVEL PROGRESS CALC
    let totalPercent = 0;

    goals.forEach((g) => {
      const gp = progress.goalProgress.find(
        (p) => p.goalId === g._id.toString()
      );
      const current = gp ? gp.progress : 0;

      totalPercent += g.target > 0 ? Math.min(current / g.target, 1) : 1;
    });

    const totalGoals = goals.length || 1;
    let progressPercent = Math.round((totalPercent / totalGoals) * 100);

    // 🔥7️⃣ Dynamic Next Step
    const nextLevel = tier.levels.find(
      (lvl) => lvl.levelNumber === currentLevel.levelNumber + 1
    );

    let nextStep = { type: "", value: "" };

    const isLastLevel = !nextLevel;
    const isLastTier = !(await Tier.findOne({
      adminId,
      platformId,
      order: tier.order + 1,
      isActive: true,
    }));

    const allGoalsCompleted = goalData.every((g) => g.isCompleted);

    if (!isLastLevel) {
      nextStep = { type: "NEXT_LEVEL", value: nextLevel.levelNumber };
    } else if (!isLastTier) {
      const nextTier = await Tier.findOne({
        adminId,
        platformId,
        order: tier.order + 1,
        isActive: true,
      });

      nextStep = { type: "NEXT_TIER", value: nextTier.tierName };
    } else {
      if (allGoalsCompleted) {
        nextStep = { type: "COMPLETED_ALL", value: null };
        progressPercent = 100;
      } else {
        nextStep = {
          type: "STAY_ON_LAST_LEVEL",
          value: currentLevel.levelNumber,
        };
      }
    }

    // 8️⃣ Pending rewards
    const rawPendingRewards = await TierRewardLog.find({
      userId,
      adminId,
      platformId,
      isClaimed: false,
      action: "REWARD_EARNED",
    }).lean();

    // 9️⃣ Past rewards
    const rawPastRewards = await TierRewardLog.find({
      userId,
      adminId,
      platformId,
      isClaimed: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    //  🔥 GROUPING HELPERS
    const groupRewards = (list = []) => ({
      scratch: list.filter((r) => r.rewardMethod === "SCRATCHCARD"),
      spin: list.filter((r) => r.rewardMethod === "SPIN"),
    });

    // ⭐ UPCOMING REWARDS (from next level definition)
    // const rawUpcomingRewards = nextLevel ? nextLevel.rewards : [];
    const rawUpcomingRewards = currentLevel.rewards;

    // Group upcoming also
    const upcomingRewards = {
      scratch:
        nextLevel?.rewardMethod === "SCRATCHCARD" ? rawUpcomingRewards : [],
      spin: nextLevel?.rewardMethod === "SPIN" ? rawUpcomingRewards : [],
    };

    const pendingRewards = groupRewards(rawPendingRewards);
    const pastRewards = groupRewards(rawPastRewards);

    // 🔐10️⃣ ENCRYPT RESPONSE
    const safePayload = clean({
      currentStatus: {
        tierName: tier.tierName,
        level: currentLevel.levelNumber,
        currentTierLevel: tier.order,
        progressPercent,
      },

      nextStep,
      levels: tier.levels,
      goals: goalData,

      history: progress.progressHistory, // ⭐ include level history

      // pendingRewards,
      // upcomingRewards: nextLevel ? nextLevel.rewards : [],
      // pastRewards,
      pendingRewards,
      upcomingRewards,
      pastRewards,
      redeemedRewards: rawPendingRewards, // future use

      debug: {
        currentTierId: progress.currentTierId,
        currentLevel: progress.currentLevel,
        goalProgress: progress.goalProgress,
      },
    });

    const encryptedData = encryptData(safePayload);

    return res.status(200).json({
      success: true,
      data: encryptedData,
    });
  } catch (err) {
    console.error("Error fetching tier progress:", err);
    next(err);
  }
};

// export const getUserTierProgressController = async (req, res, next) => {
//   try {
//     const userId = req.user._id;

//     // 1️⃣ Validate user
//     const user = await AffUser.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const adminId = user.workingOn; // admin this user belongs to

//     // 2️⃣ Find Admin (IMPORTANT: MUST BE AWAITED)
//     const admin = await AffUser.findById(adminId);
//     if (!admin) {
//       // return res.status(404).json({ message: "Admin not found" });
//       throw new Error("Admin not found");
//     }

//     const platformId = admin.platformId;

//     // console.log("Platform ID:", platformId);
//     // console.log("Admin ID:", adminId);
//     // console.log(admin,'adminId===================');
//     // console.log(adminId,'adminId===================');

//     // 2️⃣ Fetch progress doc
//     let progress = await UserTierProgress.findOne({
//       userId,
//       adminId,
//       platformId,
//     });

//     if (!progress) {
//       return res.status(203).json({
//         message: "No tier progress found",
//         progress: null,
//       });
//     }

//     // 3️⃣ Load current tier
//     const tier = await Tier.findById(progress.currentTierId);
//     if (!tier) {
//       // return res.status(404).json({ message: "Tier not found for progress" });
//       throw new Error("Tier not found for progress");
//     }

//     const currentLevel = tier.levels.find(
//       (l) => l.levelNumber === progress.currentLevel
//     );

//     if (!currentLevel) {
//       // return res
//       //   .status(404)
//       //   .json({ message: "Current level not found in tier" });
//       throw new Error("Current level not found in tier");
//     }

//     // -----------------------------
//     // 4️⃣ Goal Completion Summary
//     // -----------------------------
//     const goals = currentLevel.goals;

//     const goalData = goals.map((g) => {
//       return {
//         goalType: g.goalType,
//         target: g.target,
//         progress:
//           g.goalType === "ORDERS"
//             ? progress.goalProgress.orders
//             : g.goalType === "CLICKS"
//             ? progress.goalProgress.clicks
//             : progress.goalProgress.sales,
//       };
//     });

//     // overall progress (for top progress bar) – continuous based on each goal's percentage
//     let totalGoalProgress = 0;

//     goals.forEach((g) => {
//       const current =
//         g.goalType === "ORDERS"
//           ? progress.goalProgress.orders
//           : g.goalType === "CLICKS"
//           ? progress.goalProgress.clicks
//           : progress.goalProgress.sales;

//       // avoid division by zero, and cap at 100% per goal
//       if (g.target > 0) {
//         totalGoalProgress += Math.min(current / g.target, 1); // 0 to 1
//       } else {
//         // if target is somehow 0, treat it as already complete
//         totalGoalProgress += 1;
//       }
//     });

//     const totalGoals = goals.length || 1; // avoid /0
//     const progressPercent = Math.round((totalGoalProgress / totalGoals) * 100);

//     // -----------------------------
//     // 5️⃣ Pending CLAIMABLE Rewards
//     // -----------------------------
//     const pendingRewards = await TierRewardLog.find({
//       userId,
//       adminId,
//       platformId,
//       isClaimed: false,
//       action: "REWARD_EARNED",
//     }).lean();

//     // -----------------------------
//     // 6️⃣ Upcoming rewards (next level)
//     // -----------------------------
//     const nextLevel = tier.levels.find(
//       (lvl) => lvl.levelNumber === currentLevel.levelNumber + 1 && lvl.isActive
//     );

//     const upcomingRewards = nextLevel ? nextLevel.rewards : [];

//     // -----------------------------
//     // 7️⃣ Past Rewards (Processing / Paid)
//     // -----------------------------
//     const pastRewards = await TierRewardLog.find({
//       userId,
//       adminId,
//       platformId,
//       isClaimed: true,
//     })
//       .sort({ createdAt: -1 })
//       .lean();

//     if (!pastRewards) {
//       throw new Error("No past rewards found");
//     }

//     // -----------------------------
//     // 8️⃣ SEND RESPONSE
//     // -----------------------------
//     // return res.status(200).json({
//     //   success: true,

//     //   currentStatus: {
//     //     tierName: tier.tierName,
//     //     level: currentLevel.levelNumber,
//     //     progressPercent,
//     //   },

//     //   goals: goalData,

//     //   pendingRewards,
//     //   upcomingRewards,
//     //   pastRewards,

//     //   debug: {
//     //     currentTierId: progress.currentTierId,
//     //     currentLevel: progress.currentLevel,
//     //     goalProgress: progress.goalProgress,
//     //   },
//     // });
//     // -----------------------------
//     // 🔐  ENCRYPT EVERYTHING
//     // -----------------------------
//     const safePayload = clean({
//       currentStatus: {
//         tierName: tier.tierName,
//         level: currentLevel.levelNumber,
//         currentTierLevel: tier.order,
//         progressPercent,
//       },
//       levels: tier.levels,

//       goals: goalData,
//       pendingRewards,
//       upcomingRewards,
//       pastRewards,

//       debug: {
//         currentTierId: progress.currentTierId,
//         currentLevel: progress.currentLevel,
//         goalProgress: progress.goalProgress,
//       },
//     });
//     const encryptedData = encryptData(safePayload);

//     // -----------------------------
//     // 8️⃣ SEND RESPONSE
//     // -----------------------------
//     return res.status(200).json({
//       success: true,
//       data: encryptedData,
//     });
//   } catch (err) {
//     console.error("Error fetching tier progress:", err);
//     next(err);
//   }
// };

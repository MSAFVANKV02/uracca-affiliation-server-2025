// import { TierRewardLog } from "../../models/tier-models/tierRewardLogsSchema.js";
// import { Tier } from "../../models/tier-models/tierSystemSchema.js";
// import { UserTierProgress } from "../../models/tier-models/tierUserProgressSchema.js";

// export default class TierProgressEngine {
//   constructor({ user, adminId, platformId }) {
//     this.user = user;
//     this.adminId = adminId;
//     this.platformId = platformId;
//   }

//   /* ------------------------------------------
//    * Ensure progress doc exists
//    * ------------------------------------------ */
//   async ensureProgressDoc() {
//     let doc = await UserTierProgress.findOne({
//       userId: this.user._id,
//       adminId: this.adminId,
//       platformId: this.platformId,
//     });

//     // First time user
//     if (!doc) {
//       const firstTier = await Tier.findOne({
//         adminId: this.adminId,
//         isActive: true,
//       }).sort({ order: 1 });

//       if (!firstTier) return null;

//       doc = await UserTierProgress.create({
//         userId: this.user._id,
//         adminId: this.adminId,
//         platformId: this.platformId,
//         currentTierId: firstTier._id,
//         currentLevel: 1,
//         isTierCompleted: false,
//         goalProgress: { orders: 0, clicks: 0, sales: 0 },
//       });
//     }

//     /* ⭐⭐⭐ INSERT THIS FIX HERE ⭐⭐⭐ */
//     // -----------------------------------
//     // If user completed all tiers earlier,
//     // but admin added new tier later
//     // -----------------------------------
//     if (doc.isTierCompleted) {
//       const currentTier = await Tier.findById(doc.currentTierId);

//       const nextTier = await Tier.findOne({
//         adminId: this.adminId,
//         order: { $gt: currentTier.order }, // any tier added later
//         isActive: true,
//       }).sort({ order: 1 });

//       if (nextTier) {
//         // Reset progress to new tier
//         doc.currentTierId = nextTier._id;
//         doc.currentLevel = 1;
//         doc.goalProgress = { orders: 0, clicks: 0, sales: 0 };
//         doc.isTierCompleted = false;
//         await doc.save();
//       }
//     }
//     /* ⭐⭐⭐ END FIX ⭐⭐⭐ */

//     this.progressDoc = doc;
//     return doc;
//   }

//   /* ------------------------------------------
//    * Increment goal progress
//    * ------------------------------------------ */
//   async incrementGoal(goalType, amount = 1) {
//     const progress = await this.ensureProgressDoc();
//     if (!progress) return;

//     // ❌ stop if user already completed all tiers
//     if (progress.isTierCompleted) return;

//     const tier = await Tier.findById(progress.currentTierId);
//     if (!tier || !tier.isActive) return;

//     const level = tier.levels.find(
//       (l) => l.levelNumber === progress.currentLevel
//     );

//     if (!level || !level.isActive) return;

//     // Only if this level requires this goalType
//     const hasGoal = level.goals.some(
//       (g) => g.goalType.toUpperCase() === goalType.toUpperCase()
//     );
//     if (!hasGoal) return;

//     // Increment goalProgress
//     if (goalType === "ORDERS") progress.goalProgress.orders += amount;
//     if (goalType === "CLICKS") progress.goalProgress.clicks += amount;
//     if (goalType === "SALES") progress.goalProgress.sales += amount;

//     await progress.save();

//     return this.checkLevelCompletion(tier, level);
//   }

//   /* ------------------------------------------
//    * Check if level completed
//    * ------------------------------------------ */
//   async checkLevelCompletion(tier, level) {
//     const progress = this.progressDoc;

//     const isCompleted = level.goals.every((g) => {
//       if (g.goalType === "ORDERS")
//         return progress.goalProgress.orders >= g.target;
//       if (g.goalType === "CLICKS")
//         return progress.goalProgress.clicks >= g.target;
//       if (g.goalType === "SALES")
//         return progress.goalProgress.sales >= g.target;
//       return false;
//     });

//     if (!isCompleted) return;

//     // Log rewards
//     await this.grantRewards(level, tier);

//     // Add history record
//     progress.progressHistory.push({
//       tierId: tier._id,
//       levelNumber: level.levelNumber,
//       achievedAt: new Date(),
//     });

//     // Reset progress
//     progress.goalProgress = { orders: 0, clicks: 0, sales: 0 };

//     // Next level?
//     const nextLevel = tier.levels.find(
//       (l) => l.levelNumber === level.levelNumber + 1 && l.isActive
//     );

//     if (nextLevel) {
//       progress.currentLevel = nextLevel.levelNumber;
//       await progress.save();
//       return progress;
//     }

//     // Completed all levels → complete tier
//     await this.completeTier(tier);
//     await progress.save();
//     return progress;
//   }

//   /* ------------------------------------------
//    * Grant rewards
//    * ------------------------------------------ */
//   async grantRewards(level, tier) {
//     for (const r of level.rewards) {
//       if (!r.isActive) continue;

//       await TierRewardLog.create({
//         adminId: this.adminId,
//         platformId: this.platformId,
//         userId: this.user._id,
//         tierId: tier._id,
//         levelNumber: level.levelNumber,
//         rewardType: r.rewardType,
//         rewardMethod: level.rewardMethod, // ⭐ spin or scratch
//         rewardValue: r.value,
//         rewardLabel: r.label,
//         valueType: r.valueType,
//         action: "REWARD_EARNED",
//       });
//     }
//   }

//   /* ------------------------------------------
//    * Complete tier → move to next tier or finish system
//    * ------------------------------------------ */
//   async completeTier(tier) {
//     const progress = this.progressDoc;

//     // Log tier complete
//     await TierRewardLog.create({
//       adminId: this.adminId,
//       platformId: this.platformId,
//       userId: this.user._id,
//       tierId: tier._id,
//       action: "TIER_COMPLETED",
//     });

//     // Find next tier
//     const nextTier = await Tier.findOne({
//       adminId: this.adminId,
//       order: tier.order + 1,
//       isActive: true,
//     });

//     if (nextTier) {
//       // Move to next tier
//       progress.currentTierId = nextTier._id;
//       progress.currentLevel = 1;
//       progress.goalProgress = { orders: 0, clicks: 0, sales: 0 };
//       progress.isTierCompleted = false;
//     } else {
//       // No more tiers → mark user fully completed
//       progress.isTierCompleted = true;
//     }
//   }
// }
import { TierRewardLog } from "../../models/tier-models/tierRewardLogsSchema.js";
import { Tier } from "../../models/tier-models/tierSystemSchema.js";
import { UserTierProgress } from "../../models/tier-models/tierUserProgressSchema.js";

export default class TierProgressEngine {
  constructor({ user, adminId, platformId }) {
    this.user = user;
    this.adminId = adminId;
    this.platformId = platformId;
  }

  /* ------------------------------------------
   * Helper: build goalProgress from a level
   * ------------------------------------------ */
  buildGoalProgressFromLevel(level) {
    if (!level) return [];
    return level.goals.map((g) => ({
      goalId: g._id.toString(),
      goalType: g.goalType,
      target: g.target,
      progress: 0,
      isCompleted: false,
    }));
  }

  /* ------------------------------------------
   * Ensure progress doc exists
   * ------------------------------------------ */
  async ensureProgressDoc() {
    let doc = await UserTierProgress.findOne({
      userId: this.user._id,
      adminId: this.adminId,
      platformId: this.platformId,
    });

    // First time user → assign first tier + level
    if (!doc) {
      const firstTier = await Tier.findOne({
        adminId: this.adminId,
        platformId: this.platformId,
        isActive: true,
      }).sort({ order: 1 });

      if (!firstTier) return null;

      const firstLevel =
        firstTier.levels.find((l) => l.isActive && l.levelNumber === 1) ||
        firstTier.levels.find((l) => l.isActive);

      doc = await UserTierProgress.create({
        userId: this.user._id,
        adminId: this.adminId,
        platformId: this.platformId,
        currentTierId: firstTier._id,
        currentLevel: firstLevel ? firstLevel.levelNumber : 1,
        isTierCompleted: false,
        goalProgress: this.buildGoalProgressFromLevel(firstLevel),
      });

      return doc;
    }

    // --- If user had completed all tiers before, but admin added new tier later ---
    if (doc.isTierCompleted) {
      const currentTier = doc.currentTierId
        ? await Tier.findById(doc.currentTierId)
        : null;

      const currentOrder = currentTier?.order ?? 0;

      const nextTier = await Tier.findOne({
        adminId: this.adminId,
        platformId: this.platformId,
        order: { $gt: currentOrder },
        isActive: true,
      }).sort({ order: 1 });

      if (nextTier) {
        const firstLevel =
          nextTier.levels.find((l) => l.isActive && l.levelNumber === 1) ||
          nextTier.levels.find((l) => l.isActive);

        doc.currentTierId = nextTier._id;
        doc.currentLevel = firstLevel ? firstLevel.levelNumber : 1;
        doc.goalProgress = this.buildGoalProgressFromLevel(firstLevel);
        doc.isTierCompleted = false;
        await doc.save();
      }
    }

    // --- If for some reason goalProgress is empty, rebuild for current level ---
    if (!doc.goalProgress || doc.goalProgress.length === 0) {
      const tier = await Tier.findById(doc.currentTierId);
      const level =
        tier?.levels.find(
          (l) => l.levelNumber === doc.currentLevel && l.isActive
        ) || null;

      if (level) {
        doc.goalProgress = this.buildGoalProgressFromLevel(level);
        await doc.save();
      }
    }

    return doc;
  }

  /* ------------------------------------------
   * Increment goal progress (by goalType)
   * ------------------------------------------ */
  async incrementGoal(goalType, amount = 1) {
    const progress = await this.ensureProgressDoc();
    if (!progress) return;

    // stop if user fully done and no new tiers
    if (progress.isTierCompleted) return;

    const tier = await Tier.findById(progress.currentTierId);
    if (!tier || !tier.isActive) return;

    const level = tier.levels.find(
      (l) => l.levelNumber === progress.currentLevel
    );
    if (!level || !level.isActive) return;

    // Does this level even use this goalType?
    const levelHasGoalType = level.goals.some(
      (g) => g.goalType.toUpperCase() === goalType.toUpperCase()
    );
    if (!levelHasGoalType) return;

    // Find NEXT uncompleted goal of this type (sequential tasks)
    const nextGoal = level.goals.find((g) => {
      if (g.goalType.toUpperCase() !== goalType.toUpperCase()) return false;
      const gp = progress.goalProgress.find(
        (p) => p.goalId === g._id.toString()
      );
      return !gp || !gp.isCompleted;
    });

    if (!nextGoal) {
      // no remaining tasks of this type in this level
      return;
    }

    // Ensure progress entry exists for this goal
    let goalProg = progress.goalProgress.find(
      (p) => p.goalId === nextGoal._id.toString()
    );

    if (!goalProg) {
      goalProg = {
        goalId: nextGoal._id.toString(),
        goalType: nextGoal.goalType,
        target: nextGoal.target,
        progress: 0,
        isCompleted: false,
      };
      progress.goalProgress.push(goalProg);
    }

    // Increment ONLY this goal
    goalProg.progress += amount;

    if (goalProg.progress >= goalProg.target) {
      goalProg.isCompleted = true;
    }

    await progress.save();

    return this.checkLevelCompletion(tier, level, progress);
  }

  /* ------------------------------------------
   * Check if current level is completed
   * ------------------------------------------ */
  async checkLevelCompletion(tier, level, progress) {
    // Level is completed when ALL its goals are completed
    const allGoalsCompleted = level.goals.every((g) => {
      const gp = progress.goalProgress.find(
        (p) => p.goalId === g._id.toString()
      );
      return gp && gp.isCompleted;
    });

    if (!allGoalsCompleted) return;

    // Log rewards for this level
    await this.grantRewards(level, tier);

    // Add history record // OLD
    // progress.progressHistory.push({
    //   tierId: tier._id,
    //   levelNumber: level.levelNumber,
    //   achievedAt: new Date(),
    // });
    // NEW — save goals snapshot also
    progress.progressHistory.push({
      tierId: tier._id,
      levelNumber: level.levelNumber,
      achievedAt: new Date(),
      goals: progress.goalProgress.map((g) => ({
        goalId: g.goalId,
        goalType: g.goalType,
        target: g.target,
        progress: g.progress,
        isCompleted: g.isCompleted,
      })),
    });

    // Move to next level, or complete tier
    const nextLevel = tier.levels.find(
      (l) => l.levelNumber === level.levelNumber + 1 && l.isActive
    );

    if (nextLevel) {
      progress.currentLevel = nextLevel.levelNumber;
      progress.goalProgress = this.buildGoalProgressFromLevel(nextLevel);
      await progress.save();
      return progress;
    }

    // No next level → tier completed
    await this.completeTier(tier, progress);
    await progress.save();
    return progress;
  }

  /* ------------------------------------------
   * Grant rewards
   * ------------------------------------------ */
  async grantRewards(level, tier) {
    for (const r of level.rewards) {
      if (!r.isActive) continue;

      await TierRewardLog.create({
        adminId: this.adminId,
        platformId: this.platformId,
        userId: this.user._id,
        tierId: tier._id,
        levelNumber: level.levelNumber,
        rewardType: r.rewardType,
        rewardMethod: level.rewardMethod, // spin or scratch
        rewardValue: r.value,
        rewardLabel: r.label,
        valueType: r.valueType,
        action: "REWARD_EARNED",
      });
    }
  }

  /* ------------------------------------------
   * Complete tier → move to next tier or finish system
   * ------------------------------------------ */
  async completeTier(tier, progress) {
    // Log tier complete
    await TierRewardLog.create({
      adminId: this.adminId,
      platformId: this.platformId,
      userId: this.user._id,
      tierId: tier._id,
      action: "TIER_COMPLETED",
    });

    // Find next tier
    const nextTier = await Tier.findOne({
      adminId: this.adminId,
      platformId: this.platformId,
      order: { $gt: tier.order },
      isActive: true,
    }).sort({ order: 1 });

    if (nextTier) {
      const firstLevel =
        nextTier.levels.find((l) => l.isActive && l.levelNumber === 1) ||
        nextTier.levels.find((l) => l.isActive);

      progress.currentTierId = nextTier._id;
      progress.currentLevel = firstLevel ? firstLevel.levelNumber : 1;
      progress.goalProgress = this.buildGoalProgressFromLevel(firstLevel);
      progress.isTierCompleted = false;
    } else {
      // No more tiers → mark user fully completed
      progress.isTierCompleted = true;
      // progress.goalProgress = [];
      progress.goalProgress = progress.goalProgress.length
        ? progress.goalProgress
        : level.goals.map((g) => ({
            goalId: g._id.toString(),
            goalType: g.goalType,
            target: g.target,
            progress: g.target,
            isCompleted: true,
          }));
    }
  }
}

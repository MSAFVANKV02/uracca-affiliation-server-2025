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
     * Ensure progress doc exists
     * ------------------------------------------ */
    async ensureProgressDoc() {
      let doc = await UserTierProgress.findOne({
        userId: this.user._id,
        adminId: this.adminId,
        platformId: this.platformId,
      });
  
      // First time user
      if (!doc) {
        const firstTier = await Tier.findOne({
          adminId: this.adminId,
          isActive: true,
        }).sort({ order: 1 });
  
        if (!firstTier) return null;
  
        doc = await UserTierProgress.create({
          userId: this.user._id,
          adminId: this.adminId,
          platformId: this.platformId,
          currentTierId: firstTier._id,
          currentLevel: 1,
          isTierCompleted: false,
          goalProgress: { orders: 0, clicks: 0, sales: 0 },
        });
      }
  
      this.progressDoc = doc;
      return doc;
    }
  
    /* ------------------------------------------
     * Increment goal progress
     * ------------------------------------------ */
    async incrementGoal(goalType, amount = 1) {
      const progress = await this.ensureProgressDoc();
      if (!progress) return;
  
      // ❌ stop if user already completed all tiers
      if (progress.isTierCompleted) return;
  
      const tier = await Tier.findById(progress.currentTierId);
      if (!tier || !tier.isActive) return;
  
      const level = tier.levels.find(
        (l) => l.levelNumber === progress.currentLevel
      );
  
      if (!level || !level.isActive) return;
  
      // Only if this level requires this goalType
      const hasGoal = level.goals.some(
        (g) => g.goalType.toUpperCase() === goalType.toUpperCase()
      );
      if (!hasGoal) return;
  
      // Increment goalProgress
      if (goalType === "ORDERS") progress.goalProgress.orders += amount;
      if (goalType === "CLICKS") progress.goalProgress.clicks += amount;
      if (goalType === "SALES") progress.goalProgress.sales += amount;
  
      await progress.save();
  
      return this.checkLevelCompletion(tier, level);
    }
  
    /* ------------------------------------------
     * Check if level completed
     * ------------------------------------------ */
    async checkLevelCompletion(tier, level) {
      const progress = this.progressDoc;
  
      const isCompleted = level.goals.every((g) => {
        if (g.goalType === "ORDERS")
          return progress.goalProgress.orders >= g.target;
        if (g.goalType === "CLICKS")
          return progress.goalProgress.clicks >= g.target;
        if (g.goalType === "SALES")
          return progress.goalProgress.sales >= g.target;
        return false;
      });
  
      if (!isCompleted) return;
  
      // Log rewards
      await this.grantRewards(level, tier);
  
      // Add history record
      progress.progressHistory.push({
        tierId: tier._id,
        levelNumber: level.levelNumber,
        achievedAt: new Date(),
      });
  
      // Reset progress
      progress.goalProgress = { orders: 0, clicks: 0, sales: 0 };
  
      // Next level?
      const nextLevel = tier.levels.find(
        (l) => l.levelNumber === level.levelNumber + 1 && l.isActive
      );
  
      if (nextLevel) {
        progress.currentLevel = nextLevel.levelNumber;
        await progress.save();
        return progress;
      }
  
      // Completed all levels → complete tier
      await this.completeTier(tier);
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
            rewardMethod: level.rewardMethod,  // ⭐ spin or scratch
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
    async completeTier(tier) {
      const progress = this.progressDoc;
  
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
        order: tier.order + 1,
        isActive: true,
      });
  
      if (nextTier) {
        // Move to next tier
        progress.currentTierId = nextTier._id;
        progress.currentLevel = 1;
        progress.goalProgress = { orders: 0, clicks: 0, sales: 0 };
        progress.isTierCompleted = false;
      } else {
        // No more tiers → mark user fully completed
        progress.isTierCompleted = true;
      }
    }
  }
  

// export default class TierProgressEngine {
//   constructor({ user, adminId, platformId }) {
//     this.user = user;
//     this.adminId = adminId;
//     this.platformId = platformId;
//   }

//   /* ------------------------------------------
//    * Ensure progress document exists
//    * ------------------------------------------ */
//   async ensureProgressDoc() {
//     let doc = await UserTierProgress.findOne({
//       userId: this.user._id,
//       adminId: this.adminId,
//       platformId: this.platformId,
//     });

//     // ⭐ first-time user → assign FIRST ACTIVE TIER
//     if (!doc) {
//       const firstTier = await Tier.findOne({
//         adminId: this.adminId,
//         isActive: true,
//       }).sort({ order: 1 });

//       if (!firstTier) return null; // no active tier

//       doc = await UserTierProgress.create({
//         userId: this.user._id,
//         adminId: this.adminId,
//         platformId: this.platformId,
//         currentTierId: firstTier._id,
//         currentLevel: 1,
//         goalProgress: { orders: 0, clicks: 0, sales: 0 },
//       });
//     }

//     this.progressDoc = doc;
//     return doc;
//   }

//   /* ------------------------------------------
//    * Increment goal progress
//    * ------------------------------------------ */
//   async incrementGoal(goalType, amount = 1) {
//     const progress = await this.ensureProgressDoc();
//     if (!progress) return;

//     const tier = await Tier.findById(progress.currentTierId);
//     if (!tier || !tier.isActive) return; // ❌ tier inactive → stop

//     const level = tier.levels.find(
//       (l) => l.levelNumber === progress.currentLevel
//     );

//     if (!level || !level.isActive) return; // ❌ level inactive → stop

//     // ⭐ increase only if the level contains this goalType
//     const hasGoal = level.goals.some((g) => g.goalType === goalType.toUpperCase());
//     if (!hasGoal) return; // this action not related to this level

//     // ⭐ increment correct field
//     if (goalType === "ORDERS") {
//       progress.goalProgress.orders += amount;
//     } else if (goalType === "CLICKS") {
//       progress.goalProgress.clicks += amount;
//     } else if (goalType === "SALES") {
//       progress.goalProgress.sales += amount;
//     }

//     await progress.save();

//     return this.checkLevelCompletion(tier, level);
//   }

//   /* ------------------------------------------
//    * Check if level is completed
//    * ------------------------------------------ */
//   async checkLevelCompletion(tier, level) {
//     const progress = this.progressDoc;

//     // Check if all level goals met
//     const isCompleted = level.goals.every((g) => {
//       if (g.goalType === "ORDERS") return progress.goalProgress.orders >= g.target;
//       if (g.goalType === "CLICKS") return progress.goalProgress.clicks >= g.target;
//       if (g.goalType === "SALES") return progress.goalProgress.sales >= g.target;
//       return false;
//     });

//     if (!isCompleted) return;

//     // ⭐ Grant all rewards
//     await this.grantRewards(level, tier);

//     // Save completion in history
//     progress.progressHistory.push({
//       tierId: tier._id,
//       levelNumber: level.levelNumber,
//       achievedAt: new Date(),
//     });

//     // Reset progress
//     progress.goalProgress = { orders: 0, clicks: 0, sales: 0 };

//     // Move to next level
//     const nextLevel = tier.levels.find(
//       (l) => l.levelNumber === level.levelNumber + 1 && l.isActive
//     );

//     if (nextLevel) {
//       progress.currentLevel = nextLevel.levelNumber;
//     } else {
//       // ⭐ Tier fully complete → move to next tier
//       await this.completeTier(tier);
//     }

//     await progress.save();
//     return progress;
//   }

//   /* ------------------------------------------
//    * Grant rewards when level completes
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
//         rewardValue: r.value,
//         valueType: r.valueType,
//         action: "REWARD_EARNED",
//       });
//     }
//   }

//   /* ------------------------------------------
//    * When finishing a tier
//    * ------------------------------------------ */
//   async completeTier(tier) {
//     const progress = this.progressDoc;

//     // Log tier completed
//     await TierRewardLog.create({
//       adminId: this.adminId,
//       platformId: this.platformId,
//       userId: this.user._id,
//       tierId: tier._id,
//       action: "TIER_COMPLETED",
//     });

//     // Move to next ACTIVE tier
//     const nextTier = await Tier.findOne({
//       adminId: this.adminId,
//       order: tier.order + 1,
//       isActive: true,
//     });

//     if (nextTier) {
//       progress.currentTierId = nextTier._id;
//       progress.currentLevel = 1;
//     }
//   }
// }

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

    /* ⭐⭐⭐ INSERT THIS FIX HERE ⭐⭐⭐ */
    // -----------------------------------
    // If user completed all tiers earlier,
    // but admin added new tier later
    // -----------------------------------
    if (doc.isTierCompleted) {
      const currentTier = await Tier.findById(doc.currentTierId);

      const nextTier = await Tier.findOne({
        adminId: this.adminId,
        order: { $gt: currentTier.order }, // any tier added later
        isActive: true,
      }).sort({ order: 1 });

      if (nextTier) {
        // Reset progress to new tier
        doc.currentTierId = nextTier._id;
        doc.currentLevel = 1;
        doc.goalProgress = { orders: 0, clicks: 0, sales: 0 };
        doc.isTierCompleted = false;
        await doc.save();
      }
    }
    /* ⭐⭐⭐ END FIX ⭐⭐⭐ */

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
        rewardMethod: level.rewardMethod, // ⭐ spin or scratch
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

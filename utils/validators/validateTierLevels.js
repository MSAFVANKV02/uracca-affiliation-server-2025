// ===================== VALIDATE TIER LEVELS ===================== //

export const validateTierLevels = (levels) => {
  if (!Array.isArray(levels)) {
    throw new Error("Levels must be an array");
  }

  const validGoalTypes = ["ORDERS", "CLICKS", "SALES"];
  const validMethods = ["SPIN", "SCRATCHCARD"];

  levels.forEach((lvl, index) => {
    const levelLabel = `Level ${lvl.levelNumber || index + 1}`;

    // -------------------------------
    // Validate levelNumber
    // -------------------------------
    if (typeof lvl.levelNumber !== "number" || lvl.levelNumber <= 0) {
      throw new Error(`${levelLabel}: levelNumber must be a positive number`);
    }

    // -------------------------------
    // Validate rewardMethod
    // -------------------------------
    if (!validMethods.includes(lvl.rewardMethod)) {
      throw new Error(
        `${levelLabel}: Invalid rewardMethod "${lvl.rewardMethod}". Allowed: ${validMethods.join(
          ", "
        )}`
      );
    }

    // -------------------------------
    // Validate goals[]
    // -------------------------------
    if (!Array.isArray(lvl.goals) || lvl.goals.length === 0) {
      throw new Error(`${levelLabel}: goals must be a non-empty array`);
    }

    lvl.goals.forEach((goal, i) => {
      const goalLabel = `${levelLabel}, Goal ${i + 1}`;

      if (!validGoalTypes.includes(goal.goalType)) {
        throw new Error(
          `${goalLabel}: Invalid goalType "${goal.goalType}". Allowed: ${validGoalTypes.join(
            ", "
          )}`
        );
      }

      if (typeof goal.target !== "number" || goal.target <= 0) {
        throw new Error(`${goalLabel}: target must be a positive number`);
      }
    });

    // -------------------------------
    // Validate rewards[]
    // -------------------------------
    if (!Array.isArray(lvl.rewards) || lvl.rewards.length === 0) {
      throw new Error(`${levelLabel}: rewards must be a non-empty array`);
    }

    lvl.rewards.forEach((reward, ri) => {
      const rewardLabel = `${levelLabel}, Reward ${ri + 1}`;

      // Required fields from schema
      // if (!reward.label || typeof reward.label !== "string") {
      //   throw new Error(`${rewardLabel}: label is required`);
      // }

      if (!reward.value || typeof reward.value !== "number") {
        throw new Error(`${rewardLabel}: value is required and must be a number`);
      }

      // if (!reward.color || typeof reward.color !== "string") {
      //   throw new Error(`${rewardLabel}: color is required`);
      // }

      // if (!reward.textColor || typeof reward.textColor !== "string") {
      //   throw new Error(`${rewardLabel}: textColor is required`);
      // }

      // Optional fields — only validate type when provided
      if (reward.rewardType && typeof reward.rewardType !== "string") {
        throw new Error(`${rewardLabel}: rewardType must be a string`);
      }

      if (reward.type && typeof reward.type !== "string") {
        throw new Error(`${rewardLabel}: type must be a string`);
      }

      if (reward.isActive !== undefined && typeof reward.isActive !== "boolean") {
        throw new Error(`${rewardLabel}: isActive must be a boolean`);
      }
    });
  });

  return true; // Everything valid
};

export const validateTierLevels = (levels) => {
    if (!Array.isArray(levels)) {
      throw new Error("Levels must be an array");
    }
  
    const validGoalTypes = ["ORDERS", "CLICKS", "SALES"];
    const validMethods = ["SPIN", "SCRATCHCARD"];
    const validRewardTypes = ["CASH", "COINS"];
  
    levels.forEach((lvl, index) => {
      // Validate level number
      if (typeof lvl.levelNumber !== "number" || lvl.levelNumber <= 0) {
        throw new Error(`Level ${index + 1}: levelNumber must be a positive number`);
      }
  
      // Validate goals array
      if (!Array.isArray(lvl.goals) || lvl.goals.length === 0) {
        throw new Error(`Level ${lvl.levelNumber}: goals must be a non-empty array`);
      }
  
      lvl.goals.forEach((goal, goalIndex) => {
        // Validate goalType
        if (!validGoalTypes.includes(goal.goalType)) {
          throw new Error(
            `Level ${lvl.levelNumber}, Goal ${goalIndex + 1}: Invalid goalType "${goal.goalType}". Allowed: ${validGoalTypes.join(", ")}`
          );
        }
  
        // Validate target
        if (typeof goal.target !== "number" || goal.target <= 0) {
          throw new Error(
            `Level ${lvl.levelNumber}, Goal ${goalIndex + 1}: target must be a positive number`
          );
        }
  
        // Validate rewards object
        if (!goal.rewards || typeof goal.rewards !== "object") {
          throw new Error(
            `Level ${lvl.levelNumber}, Goal ${goalIndex + 1}: rewards object is required`
          );
        }
  
        // Validate reward method
        if (!validMethods.includes(goal.rewards.method)) {
          throw new Error(
            `Level ${lvl.levelNumber}, Goal ${goalIndex + 1}: Invalid reward method "${goal.rewards.method}". Allowed: ${validMethods.join(", ")}`
          );
        }
  
        // Validate reward type
        if (!validRewardTypes.includes(goal.rewards.rewardType)) {
          throw new Error(
            `Level ${lvl.levelNumber}, Goal ${goalIndex + 1}: Invalid rewardType "${goal.rewards.rewardType}". Allowed: ${validRewardTypes.join(", ")}`
          );
        }
  
        // Validate reward value
        if (typeof goal.rewards.value !== "number" || goal.rewards.value <= 0) {
          throw new Error(
            `Level ${lvl.levelNumber}, Goal ${goalIndex + 1}: reward value must be a positive number`
          );
        }
      });
    });
  };
  
// controllers/tier/collectRewardController.js

import { TierRewardLog } from "../../models/tier-models/tierRewardLogsSchema.js";
import { createNotification } from "../../utils/createNotification.js";
import { UserActionEnum, UserCategoryEnum } from "../../models/enum.js";
import { clean } from "../../helper/json-cleaner.js";
import { encryptData } from "../../utils/cript-data.js";

export const claimUserRewardController = async (req, res, next) => {
  try {
    const { rewardLogId, rewardId } = req.body;
    const userId = req.user._id;

    if (!rewardLogId || !rewardId) {
      throw new Error("rewardLogId and rewardId are required");
    }

    // 1️⃣ GET THE REWARD LOG
    const log = await TierRewardLog.findOne({ _id: rewardLogId, userId });

    if (!log) throw new Error("Reward log not found");

    // 2️⃣ BLOCK if no spins OR already claimed OR already collected
    if (log.spinCount <= 0 || log.isCollected || log.isClaimed) {
      throw new Error("Reward already collected");
    }

    // 3️⃣ FIND the reward inside log
    const reward = log.rewards.find((r) => r.levelRewardId === rewardId);

    if (!reward) throw new Error("Selected reward not found in log");

    // 4️⃣ PUSH new collected reward snapshot (ARRAY)
    log.collectedRewards.push({
      rewardType: reward.rewardType,
      label: reward.rewardLabel,
      value: reward.rewardValue,
      valueType: reward.valueType,
      color: reward.color,
      textColor: reward.textColor,
      image: reward.image,
      isActive: reward.isActive,
      isClaimed: true,
      isCollected: true,
      claimedAt: new Date(),
      collectedAt: new Date(),
    });

    // 5️⃣ UPDATE global log state
    log.spinCount = log.spinCount - 1;
    log.claimedAt = new Date();
    log.collectedAt = new Date();
    log.action = "REWARD_COLLECTED";

    // When all spins are used → close the log permanently
    if (log.spinCount <= 0) {
      log.isClaimed = true;
      log.isCollected = true;
    }

    await log.save();

    // 6️⃣ Create Notification
    await createNotification({
      userId,
      action: UserActionEnum.REWARD_COLLECT,
      recipientType: "user",
      category: UserCategoryEnum.REWARD,
      message: `You collected reward: ${reward.rewardLabel}`,
      metadata: {
        rewardLogId,
        rewardId,
        tierId: log.tierId,
        levelNumber: log.levelNumber,
      },
    });

    const safePayload = clean({
      collectedRewards: log.collectedRewards,
      log,
    });

    const encryptedData = encryptData(safePayload);

    return res.json({
      message: "Reward collected successfully",
      data: encryptedData,
    });
  } catch (err) {
    console.error("collectRewardController error", err);
    next(err);
  }
};

// export const claimUserRewardController = async (req, res, next) => {
//   try {
//     const { rewardLogId, rewardId } = req.body;
//     const userId = req.user._id;

//     if (!rewardLogId || !rewardId) {
//       //   return res
//       //     .status(400)
//       //     .json({ message: "rewardLogId and rewardId are required" });
//       throw new Error("rewardLogId and rewardId are required");
//     }

//     // 1️⃣ GET THE REWARD LOG
//     const log = await TierRewardLog.findOne({
//       _id: rewardLogId,
//       userId,
//     });

//     if (!log) {
//       //   return res.status(404).json({ message: "Reward log not found" });
//       throw new Error("Reward log not found");
//     }

//     if (log.spinCount <= 0) {
//       //   return res.status(400).json({ message: "No spins left" });
//       throw new Error("No spins left");
//     }

//     if (log.spinCount <= 0 || log.isCollected || log.isClaimed) {
//       throw new Error("Reward already collected");
//     }

//     // 2️⃣ FIND THE REWARD INSIDE LOG
//     const reward = log.rewards.find((r) => r.levelRewardId === rewardId);

//     if (!reward) {
//       //   return res
//       //     .status(404)
//       //     .json({ message: "Selected reward not found in log" });
//       throw new Error("Selected reward not found in log");
//     }

//     // 3️⃣ UPDATE COLLECTED REWARD SNAPSHOT
//     log.collectedReward = {
//       rewardType: reward.rewardType,
//       label: reward.rewardLabel,
//       value: reward.rewardValue,
//       valueType: reward.valueType,
//       color: reward.color,
//       textColor: reward.textColor,
//       image: reward.image,
//       isActive: reward.isActive,
//     };

//     // 4️⃣ UPDATE STATUS
//     log.isClaimed = true;
//     log.claimedAt = new Date();
//     log.isCollected = true;
//     log.collectedAt = new Date();
//     log.spinCount = log.spinCount - 1;

//     log.action = "REWARD_COLLECTED";

//     await log.save();

//     // 5️⃣ SEND NOTIFICATION
//     await createNotification({
//       userId: userId,
//       action: UserActionEnum.REWARD_COLLECT, // Add this enum
//       recipientType: "user",
//       category: UserCategoryEnum.REWARD,
//       message: `You collected reward: ${reward.rewardLabel}`,
//       metadata: {
//         rewardLogId,
//         rewardId,
//         tierId: log.tierId,
//         levelNumber: log.levelNumber,
//       },
//     });

//     const safePayload = clean({
//       collectedReward: log.collectedReward,
//       log,
//     });

//     const encryptedData = encryptData(safePayload);
//     return res.json({
//       message: "Reward collected successfully",
//       data: encryptedData,
//     });
//   } catch (err) {
//     console.error("collectRewardController error", err);
//     // return res.status(500).json({ message: err.message });
//     next(err);
//   }
// };

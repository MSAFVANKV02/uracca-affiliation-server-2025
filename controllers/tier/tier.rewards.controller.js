// controllers/tier/collectRewardController.js

import { TierRewardLog } from "../../models/tier-models/tierRewardLogsSchema.js";
import { createNotification } from "../../utils/createNotification.js";
import { UserActionEnum, UserCategoryEnum } from "../../models/enum.js";
import { clean } from "../../helper/json-cleaner.js";
import { encryptData } from "../../utils/cript-data.js";
import { MissingFieldError, NotFoundError } from "../../utils/errors.js";
import AffUser from "../../models/aff-user.js";

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

    // console.log(log.spinCount, "remaining spins before collection");

    // 5️⃣ UPDATE global log state
    log.spinCount = log.spinCount - 1;

    // console.log(log.spinCount, "remaining spins after collection");

    // When all spins are used → close the log permanently
    if (log.spinCount <= 0) {
      log.isClaimed = true;
      log.isCollected = true;
      log.claimedAt = new Date();
      log.collectedAt = new Date();
      log.action = "REWARD_COLLECTED";
    }

    await log.save();

    // 6️⃣ Create Notification
    await createNotification({
      userId,
      action: UserActionEnum.REWARD_CLAIM,
      recipientType: "USER",
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

export const getUserRewardsForTheirAdmins = async (req, res, next) => {
  try {
    const admin = req.admin;
    const adminId = req.admin._id;

    const adminData = await AffUser.findById(adminId).select("collaborateWith");

    if (!adminData) {
      throw new NotFoundError("Admin not found");
    }

    const collaboratorIds = adminData.collaborateWith
      .filter((c) => c.status === "ACCEPTED")
      .map((c) => c.accountId);

    // Include admin's own reward logs too
    collaboratorIds.push(adminId);

    const logs = await TierRewardLog.find({
      adminId: adminId,
      userId: { $in: collaboratorIds },
      action: { $ne: "TIER_COMPLETED" },
    })
      .populate("userId", "fullName userName email avatar mobile")
      .populate("tierId", "tierName order isActive description")
      .sort({ createdAt: -1 });

    // const safePayload = clean({
    //   collectedRewards: log.collectedRewards,
    //   log,
    // });

    const encryptedData = encryptData(logs);

    return res.status(200).json({
      success: true,
      total: logs.length,
      data: encryptedData,
    });
  } catch (error) {
    next(error);
  }
};

export const updateClaimedRewards = async (req, res, next) => {
  try {
    const adminId = req.admin._id;
    const rewardLogId = req.params.rewardLogId;

    const { rewardId, status } = req.body;

    if (!rewardId || !status) {
      throw new MissingFieldError("rewardId & status required");
    }

    const log = await TierRewardLog.findOne({
      _id: rewardLogId,
      adminId,
    });

    if (!log) {
      throw new NotFoundError("Reward log not found");
    }

    /* -------------------------------------------------------------
       STEP 1 → Always update inside collectedRewards[]
    -------------------------------------------------------------- */
    const rewardItem = log.collectedRewards.id(rewardId);

    if (!rewardItem) {
      throw new NotFoundError("Reward item not found in collectedRewards");
    }

    rewardItem.status = status;

    // Update reward timestamps + boolean flags
    if (status === "PROCESSING") {
      rewardItem.isClaimed = true;
      rewardItem.claimedAt = new Date();
    }

    if (status === "PAID") {
      rewardItem.isCollected = true;
      rewardItem.collectedAt = new Date();
    }

    /* -------------------------------------------------------------
       STEP 2 → If spinCount = 0 → update main log as well
    -------------------------------------------------------------- */
    if (log.spinCount === 0) {
      log.status = status;

      if (status === "PROCESSING") {
        log.isClaimed = true;
        log.claimedAt = new Date();
      }

      if (status === "PAID") {
        log.isCollected = true;
        log.collectedAt = new Date();
      }

      if (status === "DELIVERED") {
        log.isDelivered = true;
        log.deliveredAt = new Date();
      }
    }

    /* -------------------------------------------------------------
       STEP 3 → Save
    -------------------------------------------------------------- */
    await log.save();

    return res.status(200).json({
      message: "Reward updated successfully",
    });
  } catch (error) {
    console.log(error)
    next(error); // ⬅ passes error to global handler
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

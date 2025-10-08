import AffiliateHistory from "../models/AffiliateHistorySchema.js";

export async function addHistory(
  userId,
  action,
  amount = 0,
  category = "GENERAL",
  metadata = {},
) {
  try {
    // console.log(
    //   userId,
    //   action,
    //   amount,
    //   category,
    //   metadata,
    //   `
    //    user: userId,
    //   action,
    //   amount,
    //   category,
    //   metadata,
    //   `
    // );

    await AffiliateHistory.create({
      user: userId,
      action,
      amount,
      category,
      metadata,
    });
  } catch (err) {
    console.error("Failed to record history:", err);
  }
}

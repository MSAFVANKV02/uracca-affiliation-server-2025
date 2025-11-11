import Withdrawals from "../../models/withdrawalSchema.js";

export const razorpayWebhook = async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    if (event === "payout.processed") {
      const payout = payload.payout.entity;
      await Withdrawals.findOneAndUpdate(
        { razorpayPayoutId: payout.id },
        { $set: { status: "COMPLETED" } }
      );
      console.log(`✅ Payout ${payout.id} marked COMPLETED`);
    }

    if (event === "payout.failed") {
      const payout = payload.payout.entity;
      await Withdrawals.findOneAndUpdate(
        { razorpayPayoutId: payout.id },
        { $set: { status: "FAILED" } }
      );
      console.log(`❌ Payout ${payout.id} marked FAILED`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false });
  }
};

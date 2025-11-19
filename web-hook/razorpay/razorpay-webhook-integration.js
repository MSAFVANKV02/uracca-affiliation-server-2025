import Withdrawals from "../../models/withdrawalSchema.js";
import crypto from "crypto";
import { BadRequestError } from "../../utils/errors.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import { Wallet } from "../../models/walletSchema.js";

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export const razorpayWebhook = async (req, res) => {
  // const rawBody = req.rawBody;
  const rawBody = req.body;
  // console.log(rawBody, "rawBody razorpayWebhook");
  // console.log(req, "req razorpayWebhook");

  if (!rawBody) {
    console.log("RAW BODY STILL MISSING!");
    // return res.status(400).send("No raw body received");
  }

  const razorpaySignature = req.headers["x-razorpay-signature"];
  const webhookSecret = SECRET;

  // 🔥 MUST VERIFY USING RAW BODY STRING
  validateWebhookSignature(
    rawBody.toString(),
    razorpaySignature,
    webhookSecret
  );

  // const data = JSON.parse(rawBody.toString());

  try {
    const data = JSON.parse(rawBody.toString());
    const event = data.event;
    const payload = data.payload;
    console.log(event, "event");

    // const event = req.body.event;
    // const payload = req.body.payload;

    if (event === "payout.processed") {
      const payout = payload.payout.entity;
      await Withdrawals.findOneAndUpdate(
        { razorpayPayoutId: payout.id },
        { $set: { status: "COMPLETED" } }
      );
      // 1. Update withdrawal record
      const withdrawal = await Withdrawals.findOneAndUpdate(
        { razorpayPayoutId: payout.id },
        { $set: { status: "COMPLETED" } },
        { new: true }
      );

      if (withdrawal) {
        // 2. Update wallet: pending → paid
        await Wallet.findOneAndUpdate(
          { userId: withdrawal.user, adminId: withdrawal.adminId },
          {
            $inc: {
              paidAmount: withdrawal.withdrawalAmount,
              totalAmount: withdrawal.withdrawalAmount,
              // pendingAmount: -withdrawal.withdrawalAmount,
              pendingAmount: 0,
            },
          }
        );
      }
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

    if (event === "payout.reversed") {
      const payout = payload.payout.entity;
      await Withdrawals.findOneAndUpdate(
        { razorpayPayoutId: payout.id },
        { $set: { status: "REVERSED" } }
      );
      console.log(`✅ Payout ${payout.id} marked REVERSED`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false });
  }
};

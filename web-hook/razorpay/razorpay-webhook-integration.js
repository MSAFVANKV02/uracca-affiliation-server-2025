import Withdrawals from "../../models/withdrawalSchema.js";
import crypto from "crypto";
import { BadRequestError } from "../../utils/errors.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export const razorpayWebhook = async (req, res) => {
  // const rawBody = JSON.stringify(req.rawBody);
  // console.log(req, "req razorpayWebhook");
  // console.log(req.headers, "req.header only razorpayWebhook");
  // console.log(SECRET);

  // console.log(
  //   req.headers["x-razorpay-signature"],
  //   "req.header razorpayWebhook"
  // );
  const rawBody = req.rawBody;
  console.log(rawBody, "rawBody razorpayWebhook");
  console.log(req, "req razorpayWebhook");
  const razorpaySignature = req.headers["x-razorpay-signature"];
  const webhookSecret = SECRET;

  validateWebhookSignature(
    JSON.stringify(req.rawBody),
    razorpaySignature,
    webhookSecret
  );

  // const expectedSignature = crypto
  //   .createHmac("sha256", webhookSecret)
  //   .update(rawBody)
  //   .digest("hex");
  //   console.log(expectedSignature, "expectedSignature razorpayWebhook");

  // if (SECRET !== razorpaySignature) {
  //   throw new BadRequestError("Invalid webhook signature.");
  // }

  try {
    const event = req.body.event;
    const payload = req.body.payload;
    // console.log( req.headers["x-razorpay-signature"], "req.header razorpayWebhook");

    // console.log(req.body, "req.body razorpayWebhook");

    // console.log(event, "event razorpayWebhook");
    // console.log(payload, "payload razorpayWebhook");

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

    if (event === "payout.reversed") {
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    res.status(500).json({ success: false });
  }
};

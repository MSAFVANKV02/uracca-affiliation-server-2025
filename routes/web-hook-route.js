import express from "express";
import { razorpayWebhook } from "../web-hook/razorpay/razorpay-webhook-integration.js";
const router = express.Router();


    router.post("/razorpay/withdrawal-payout",razorpayWebhook)


export default router;


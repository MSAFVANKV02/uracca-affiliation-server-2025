import express from "express";
import { trackAffiliateClick, purchaseOrderWithAffiliateCampaign } from "../controllers/campaign/track-aff-container.js";
const router = express.Router();

router.post("/clicks",trackAffiliateClick)
router.post("/purchase-campaign",purchaseOrderWithAffiliateCampaign)


export default router;

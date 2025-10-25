import express from "express";
import { trackAffiliateClick, purchaseOrderWithAffiliateCampaign } from "../controllers/campaign/track-aff-container.js";
import { checkUserStatus } from "../middleware/checkUserStatus.js";
const router = express.Router();

router.post("/clicks",trackAffiliateClick)
router.post("/purchase-campaign",checkUserStatus,purchaseOrderWithAffiliateCampaign)


export default router;

import express from "express";
import { trackAffiliateClick, purchaseOrderWithAffiliateCampaign } from "../controllers/campaign/track-aff-container.js";
import { checkUserStatus } from "../middleware/checkUserStatus.js";
import { cancelWalletCommissionAmountFromAff } from "../controllers/wallet/wallet-controller.js";
import { validatePlatformApiKey } from "../middleware/validatePlatformApiKey.js";
const router = express.Router();

// 🔐 API KEY PROTECTED ROUTES
router.use(validatePlatformApiKey);

router.post("/clicks",trackAffiliateClick)
router.post("/purchase-campaign",checkUserStatus,purchaseOrderWithAffiliateCampaign)
router.patch("/cancel-amount/:orderId",cancelWalletCommissionAmountFromAff)

export default router;

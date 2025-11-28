import express from "express";
import { authenticateUser, authenticateAdmin } from "../middleware/middleware.js";
import { createCampaign, getUserCampaigns, genericUpdateCampaigns } from "../controllers/campaign/campaign-controller.js";
const router = express.Router();

//  < -------- users campaign routes -------- >  //
router.put("/create",authenticateUser,createCampaign)
router.get("/",authenticateUser,getUserCampaigns)


// --------- for admins ---------- //
router.patch("/:campaignId",authenticateAdmin,genericUpdateCampaigns)
router.get("/admin/activeCampaigns/:userId",authenticateAdmin,getUserCampaigns)



export default router;

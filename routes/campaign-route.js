import express from "express";
import { authenticateUser } from "../middleware/middleware.js";
import { createCampaign, getUserCampaigns } from "../controllers/campaign/campaign-controller.js";
const router = express.Router();

//  < -------- users campaign routes -------- >  //
router.put("/create",authenticateUser,createCampaign)
router.get("/",authenticateUser,getUserCampaigns)


export default router;

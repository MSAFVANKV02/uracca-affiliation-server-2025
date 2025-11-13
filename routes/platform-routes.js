import express from "express";
import {
  getPlatformForUserSettings,
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/platform/platform-controller.js";
import { authenticateAdmin, authenticateUser } from "../middleware/middleware.js";
import { getAffGeneralSettings, updateAffGeneralSettings } from "../controllers/general-controller/general-controller.js";

const router = express.Router();

// Get Platform

router.get("/",authenticateAdmin, getPlatformSettings);
router.get("/platformToUser/:adminId",authenticateUser, getPlatformForUserSettings);

// Update Platform
router.put("/update",authenticateAdmin, updatePlatformSettings);


// Update general settings Platform

router.post("/general/settings",authenticateAdmin, updateAffGeneralSettings);
router.get("/general/settings", getAffGeneralSettings);


export default router;

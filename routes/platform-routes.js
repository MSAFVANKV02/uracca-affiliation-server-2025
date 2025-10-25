import express from "express";
import {
  getPlatformForUserSettings,
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/platform/platform-controller.js";
import { authenticateAdmin, authenticateUser } from "../middleware/middleware.js";

const router = express.Router();

// Get Platform

router.get("/",authenticateAdmin, getPlatformSettings);
router.get("/platformToUser/:adminId",authenticateUser, getPlatformForUserSettings);

// Update Platform
router.put("/update",authenticateAdmin, updatePlatformSettings);

export default router;

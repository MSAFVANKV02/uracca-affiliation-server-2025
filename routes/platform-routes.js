import express from "express";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/platform/platform-controller.js";

const router = express.Router();

// Get Platform
router.get("/", getPlatformSettings);

// Update Platform
router.put("/update", updatePlatformSettings);

export default router;

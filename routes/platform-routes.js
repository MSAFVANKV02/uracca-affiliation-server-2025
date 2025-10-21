import express from "express";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "../controllers/platform/platform-controller.js";
import { authenticateAdmin } from "../middleware/middleware.js";

const router = express.Router();

// Get Platform
router.get("/",authenticateAdmin, getPlatformSettings);

// Update Platform
router.put("/update",authenticateAdmin, updatePlatformSettings);

export default router;

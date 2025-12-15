import express from "express";
import { allAdminNotifications, deleteAdminNotifications } from "../controllers/notifications/notifications.controller.js";
import { authenticateAdmin } from "../middleware/middleware.js";

const router = express.Router();

router.get("/all", authenticateAdmin, allAdminNotifications);


router.delete("/delete", authenticateAdmin, deleteAdminNotifications);


export default router;

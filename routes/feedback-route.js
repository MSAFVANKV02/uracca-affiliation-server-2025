import express from "express";
import {
  getAllAffiliateFeedbacks,
  deleteAffiliateFeedbackById,
  getAffiliateFeedbackById,
  updateFeedbacksStatus,
} from "../controllers/feedback/feedback-controller.js";
import { authenticateAdmin } from "../middleware/middleware.js";

const router = express.Router();

router.get("/", authenticateAdmin, getAllAffiliateFeedbacks); // GET all feedbacks
router.get("/:id", authenticateAdmin, getAffiliateFeedbackById); // GET by ID
router.delete("/:id", authenticateAdmin, deleteAffiliateFeedbackById); // DELETE by ID
router.patch("/:id", authenticateAdmin, updateFeedbacksStatus); // DELETE by ID


export default router;

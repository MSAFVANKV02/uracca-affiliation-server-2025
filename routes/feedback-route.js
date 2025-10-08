import express from "express";
import {
  getAllAffiliateFeedbacks,
  deleteAffiliateFeedbackById,
  getAffiliateFeedbackById,
  updateFeedbacksStatus,
} from "../controllers/feedback/feedback-controller.js";

const router = express.Router();

router.get("/", getAllAffiliateFeedbacks); // GET all feedbacks
router.get("/:id", getAffiliateFeedbackById); // GET by ID
router.delete("/:id", deleteAffiliateFeedbackById); // DELETE by ID
router.patch("/:id", updateFeedbacksStatus); // DELETE by ID


export default router;

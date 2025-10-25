import express from "express";
import {
  getAllAffWithdrawalHistory,
  processWithdrawal,
  updateAffWithdrawalStatus,
} from "../controllers/withdrawals/withdrawal-controller.js";
import { checkUserStatus } from "../middleware/checkUserStatus.js";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/middleware.js";
const router = express.Router();

router.get("/all", authenticateAdmin, getAllAffWithdrawalHistory);
router.patch("/update-status", checkUserStatus, updateAffWithdrawalStatus);

// --------- user withdrawal route ------------- >
router.post(
  "/new-withdrawal/:adminId",
  authenticateUser,
  checkUserStatus,

  processWithdrawal
);

export default router;

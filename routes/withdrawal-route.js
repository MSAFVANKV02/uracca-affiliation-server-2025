import express from "express";
import {
  getAllAffWithdrawalHistory,
  updateAffWithdrawalStatus,
} from "../controllers/withdrawals/withdrawal-controller.js";
import { checkUserStatus } from "../middleware/checkUserStatus.js";
import { authenticateAdmin } from "../middleware/middleware.js";
const router = express.Router();

router.get("/all",authenticateAdmin, getAllAffWithdrawalHistory);
router.patch("/update-status",checkUserStatus, updateAffWithdrawalStatus);

export default router;

import express from "express";
import {
  getAllAffWithdrawalHistory,
  updateAffWithdrawalStatus,
} from "../controllers/withdrawals/withdrawal-controller.js";
import { checkUserStatus } from "../middleware/checkUserStatus.js";
const router = express.Router();

router.get("/all", getAllAffWithdrawalHistory);
router.patch("/update-status",checkUserStatus, updateAffWithdrawalStatus);

export default router;

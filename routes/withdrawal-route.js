import express from "express";
import {
  getAllAffWithdrawalHistory,
  updateAffWithdrawalStatus,
} from "../controllers/withdrawals/withdrawal-controller.js";
const router = express.Router();

router.get("/all", getAllAffWithdrawalHistory);
router.patch("/update-status", updateAffWithdrawalStatus);

export default router;

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
import { payWithdrawalToUser } from "../controllers/withdrawals/withdrawal-payout-controller.js";
const router = express.Router();

router.get("/all", authenticateAdmin, getAllAffWithdrawalHistory);
router.patch("/action", checkUserStatus, updateAffWithdrawalStatus);
router.patch("/payout", payWithdrawalToUser);


// --------- user withdrawal route ------------- >
router.post(
  "/new-withdrawal/:adminId",
  authenticateUser,
  checkUserStatus,

  processWithdrawal
);

export default router;

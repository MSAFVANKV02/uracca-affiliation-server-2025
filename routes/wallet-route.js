import express from "express";
import { getAllWallets,getAdminWallets,getUserAdminWallet, cancelWalletCommissionAmountFromAff, rechargeUserWallet } from "../controllers/wallet/wallet-controller.js";
import { authenticateUser, authenticateAdmin } from "../middleware/middleware.js";
const router = express.Router();

router.get("/",authenticateAdmin,getAllWallets)
router.get("/:adminId",authenticateAdmin,getAdminWallets)
router.get("/:userId/:adminId",authenticateUser,getUserAdminWallet)

router.patch("/recharge/:userId/:adminId",authenticateUser,rechargeUserWallet)




export default router;

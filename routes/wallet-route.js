import express from "express";
import { getAllWallets,getAdminWallets,getUserAdminWallet } from "../controllers/wallet/wallet-controller.js";
import { authenticateUser, authenticateAdmin } from "../middleware/middleware.js";
const router = express.Router();

router.get("/",authenticateAdmin,getAllWallets)
router.get("/:adminId",authenticateAdmin,getAdminWallets)
router.get("/:userId/:adminId",authenticateUser,getUserAdminWallet)


export default router;

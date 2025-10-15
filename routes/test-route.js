import express from "express";
import { updateOrderCompleteStatus } from "../controllers/testings-controllers.js";
const router = express.Router();

router.put("/completed/:orderId",updateOrderCompleteStatus)

export default router;

import express from "express";
import { authenticateAdmin, authenticateUser } from "../middleware/middleware.js";
import { bulkDataController, getEarningChartDataController } from "../controllers/bulk-details/bulk-controllers.js";

const router = express.Router();

router.get("/",authenticateAdmin,bulkDataController)

router.get("/chart-data",authenticateAdmin,getEarningChartDataController)


export default router;

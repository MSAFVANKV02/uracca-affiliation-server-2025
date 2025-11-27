import express from "express";
import { authenticateAdmin, authenticateUser } from "../middleware/middleware.js";
import { bulkDataController, getEarningChartDataController, getUserChartDataController } from "../controllers/bulk-details/bulk-controllers.js";

const router = express.Router();

router.get("/",authenticateAdmin,bulkDataController)

router.get("/chart-data",authenticateAdmin,getEarningChartDataController)
router.get("/user-chart-data",authenticateUser,getUserChartDataController)
router.get("/user-chart-data/:userId",authenticateAdmin,getUserChartDataController)




export default router;

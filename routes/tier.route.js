import express from "express";
import { authenticateAdmin, authenticateUser } from "../middleware/middleware.js";
import {
  createAffiliateTierController,
  updateAffiliateTierController,
  deleteAffiliateTierController,
  toggleAffiliateTierStatusController,
} from "../controllers/tier/tier.controller.js";
import { getAllAffiliateTiersController, getAllAffiliateTiersWithIdController, getUserTierProgressController } from "../controllers/tier/tier.retrieve.controller.js";
const router = express.Router();

// Create Tier
router.post("/", authenticateAdmin, createAffiliateTierController);

// Update Tier
router.put("/:tierId", authenticateAdmin, updateAffiliateTierController);

// Delete Tier
router.delete(
  "/delete/:tierId",
  authenticateAdmin,
  deleteAffiliateTierController
);

// Toggle Active/Inactive
router.patch(
  "/toggle/:tierId",
  authenticateAdmin,
  toggleAffiliateTierStatusController
);


//  ==== GET routes can be added here ====

router.get("/all", authenticateAdmin, getAllAffiliateTiersController);
router.get("/:tierId", authenticateAdmin, getAllAffiliateTiersWithIdController);
router.get("/user/my-tier", authenticateUser, getUserTierProgressController);



export default router;

import express from "express";
import {
  getProductsFromDb,
  updateProductsToDb,
  updateProductCommission,
  updateProductStatus,
  getProductsForUsersFromDb,
} from "../controllers/products/product-controllers.js";
import { authenticateUser } from "../middleware/middleware.js";

const router = express.Router();

router.get("/", getProductsFromDb); // GET all
router.post("/", updateProductsToDb); // bulk add/update
router.patch("/:id", updateProductCommission); // single commission update
router.patch("updateStatus/:id", updateProductStatus); // single commission update

router.get("/newCampaign/:adminId",authenticateUser, getProductsForUsersFromDb);


export default router;

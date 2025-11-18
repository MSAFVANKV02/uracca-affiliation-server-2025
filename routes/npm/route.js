import express from "express";
import { createPlatform } from "../../controllers/out-source/npm-controller";

const router = express.Router();

router.post("/register", createPlatform);

export default router;

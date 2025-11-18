import express from "express";
import { createNpmPackagePlatform } from "../../controllers/out-source/npm-controller.js";

const router = express.Router();

router.post("/register", createNpmPackagePlatform);

export default router;

import express from "express";
const router = express.Router();

import { getAllAffUsers } from "../controllers/user/user-controller.js";
import { updateAffUserStatus, genericUpdateAffUser } from "../controllers/user/user-updates.js";
import { login } from "../controllers/auth/auth-controller.js";
import { authenticateAdmin } from "../middleware/middleware.js";



router.get("/all",authenticateAdmin, getAllAffUsers);
router.post("/admin-login", login);

router.put("/update-status/:userId",authenticateAdmin, updateAffUserStatus);
router.put("/generic-update/:userId",authenticateAdmin, genericUpdateAffUser);

// ==== user side routes can be added here ====
// router.get("/all",authenticateUser, getAllAffUsers);



export default router;

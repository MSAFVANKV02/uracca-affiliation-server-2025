import express from "express";
const router = express.Router();

import { getAllAdminsAffUsers, getAllAffUsers, getAllAffUsersForEachAdmins, getCurrentUsers } from "../controllers/user/user-controller.js";
import { updateAffUserStatus, genericUpdateAffUser } from "../controllers/user/user-updates.js";
import { registerUser,loginUser } from "../controllers/auth/auth-controller.js";
import { authenticateAdmin, authenticateUser } from "../middleware/middleware.js";



router.get("/current-user",authenticateAdmin, getCurrentUsers);


router.get("/all",authenticateAdmin, getAllAffUsersForEachAdmins);
router.post("/admin-login", loginUser);
router.post("/admin-register", registerUser);


router.get("/all-admins",authenticateUser, getAllAdminsAffUsers);


router.put("/update-status/:userId",authenticateAdmin, updateAffUserStatus);
router.put("/generic-update/:userId",authenticateAdmin, genericUpdateAffUser);

// ==== user side routes can be added here ====
// router.get("/all",authenticateUser, getAllAffUsers);



export default router;

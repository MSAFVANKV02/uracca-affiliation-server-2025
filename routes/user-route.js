import express from "express";
const router = express.Router();

import { getAllAffUsers } from "../controllers/user/user-controller.js";
import { updateAffUserStatus, genericUpdateAffUser } from "../controllers/user/user-updates.js";


router.get("/all", getAllAffUsers);

router.put("/update-status/:userId", updateAffUserStatus);
router.put("/generic-update/:userId", genericUpdateAffUser);


export default router;

import express from "express";
import {
    admitAsReadAdminTickets,
  createScheduleTicket,
  getAllRaisedTickets,
  deleteAdminTickets,
  toggleTicketActionTaken
} from "../controllers/ticket/ticket.controller.js";
import { authenticateAdmin } from "../middleware/middleware.js";

const router = express.Router();

router.post("/call", createScheduleTicket);

router.get("/all", authenticateAdmin, getAllRaisedTickets);

router.delete("/delete", authenticateAdmin, deleteAdminTickets);

router.patch("/markAsRead/:nId", authenticateAdmin, admitAsReadAdminTickets);


router.patch("/action/:ticketId", authenticateAdmin, toggleTicketActionTaken);




export default router;

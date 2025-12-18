import mongoose from "mongoose";
import TicketSchedule from "../../models/ticketScheduleSchema.js";
import { encryptData } from "../../utils/cript-data.js";
import { MissingFieldError, NotFoundError } from "../../utils/errors.js";

export const createScheduleTicket = async (req, res, next) => {
  try {
    const { email, fullName, message, mobile, purposeOfCall } = req.body;

    // 1️⃣ Basic required validation
    if (!email || !fullName || !purposeOfCall || !mobile) {
      throw new MissingFieldError("Required fields are missing");
    }

    // 2️⃣ Get client IP (works behind proxy too)
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // 3️⃣ Check existing pending ticket from same IP
    const existingTicket = await TicketSchedule.findOne({
      "metadata.ip": clientIp,
      actionTaken: false,
    });

    if (existingTicket) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending call request. Please wait until our team responds.",
      });
    }

    // 4️⃣ Create new ticket
    const ticket = await TicketSchedule.create({
      email: email.trim(),
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      purposeOfCall: purposeOfCall.trim(),
      message: message?.trim(),
      reqType: "BOOK_SCHEDULE",
      metadata: {
        ip: clientIp,
        userAgent: req.headers["user-agent"],
      },
    });

    // 5️⃣ Success response
    return res.status(200).json({
      success: true,
      message: "Call scheduled successfully",
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRaisedTickets = async (req, res, next) => {
  try {
    const adminType = req.admin.userType;

    if (!adminType || adminType !== "SUPER_ADMIN") {
      throw new NotFoundError("This req is not valid");
    }

    const tickets = await TicketSchedule.find().sort({_id:-1});

    const encryptedData = encryptData(tickets);

    return res.status(200).json({
      success: true,
      message: "Call scheduled successfully",
      data: encryptedData,
    });
  } catch (error) {
    next(error);
  }
};



// ====================================================================================
// ========================= delete admin tickets ================================
// ====================================================================================

export const deleteAdminTickets = async (req, res, next) => {
  try {
    const adminId = req.admin?._id;

    if (!adminId) {
      throw new NotFoundError("Admin not detected");
    }

    const { ids } = req.body;

    // ✅ Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError("Tickets ids are required");
    }

    // ✅ Delete only this admin's tickets
    const result = await TicketSchedule.deleteMany({
      _id: { $in: ids },
    });

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} tickets(s) deleted successfully`,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

// ====================================================================================
// ========================= isRead admin tickets ================================
// ====================================================================================

export const admitAsReadAdminTickets = async (req, res, next) => {
  try {
    const adminId = req.admin?._id;

    if (!adminId) {
      throw new NotFoundError("Admin not detected");
    }

    const { nId } = req.params;

    // ✅ Validate input
    if (!nId) {
      throw new BadRequestError("Ticket id is required");
    }

    // ✅ Delete only this admin's tickets
    const result = await TicketSchedule.updateOne(
      {
        _id: nId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError("Ticket not found");
    }

        const encryptedData = encryptData(result);


    return res.status(200).json({
      success: true,
      message: "Ticket marked as read",
      count: result.modifiedCount,
      data: encryptedData,

    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};


export const toggleTicketActionTaken = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    // 1️⃣ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket id",
      });
    }

    // 2️⃣ Find ticket
    const ticket = await TicketSchedule.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    // 3️⃣ Toggle actionTaken
    ticket.actionTaken = !ticket.actionTaken;
    await ticket.save();

        const encryptedData = encryptData(ticket);


    // 4️⃣ Response
    return res.status(200).json({
      success: true,
      message: `Action status updated to ${ticket.actionTaken}`,
      data: encryptedData,
    });
  } catch (error) {
    next(error);
  }
};
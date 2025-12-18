import mongoose from "mongoose";

const TicketScheduleSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    purposeOfCall: {
      type: String,
      required: true,
    },
     reqType: {
      type: String,
      enum:["BOOK_SCHEDULE","DEVELOPER_SCHEDULE"]
    },
    

    isRead: {
      type: Boolean,
      default: false,
    },
    actionTaken: {
      type: Boolean,
      default: false,
    },

    metadata: { type: Object, default: {} }, // store extra info (method, IP, etc.)
    message: String,

    // updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const TicketSchedule =
  mongoose.models.Ticket || mongoose.model("Ticket", TicketScheduleSchema);

export default TicketSchedule;

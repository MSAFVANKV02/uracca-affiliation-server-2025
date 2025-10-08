import AffUser from "../models/aff-user.js";


export const checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.body.userId || req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user = await AffUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "This account is blocked." });
    }

    // Check status enum
    if (user.status === "SUSPENDED") {
      return res.status(403).json({ message: "This account is suspended." });
    }

    if (user.status === "PAUSED") {
      return res.status(403).json({ message: "This account is paused." });
    }

    // Everything OK, continue
    next();
  } catch (error) {
    console.error("Check User Status Middleware Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

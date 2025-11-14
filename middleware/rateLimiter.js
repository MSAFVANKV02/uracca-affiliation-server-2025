// import rateLimit from "express-rate-limit";

// const convertToMs = (str) => {
//   const num = parseInt(str);
//   if (str.endsWith("ms")) return num;
//   if (str.endsWith("s")) return num * 1000;
//   if (str.endsWith("m")) return num * 1000 * 60;
//   if (str.endsWith("h")) return num * 1000 * 60 * 60;
//   return num;
// };

// export const makeLimiter = (window, max) =>
//   rateLimit({
//     windowMs: convertToMs(window),
//     max,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: {
//       success: false,
//       message: "Too many requests. Please try again later.",
//     },
//   });
// ======== basic code is above ======
import rateLimit from "express-rate-limit";

const convertToMs = (str) => {
  const num = parseInt(str);
  if (str.endsWith("ms")) return num;
  if (str.endsWith("s")) return num * 1000;
  if (str.endsWith("m")) return num * 1000 * 60;
  if (str.endsWith("h")) return num * 1000 * 60 * 60;
  return num;
};

export const makeLimiter = (window, max) =>
  rateLimit({
    windowMs: convertToMs(window),
    max,
    standardHeaders: true,
    legacyHeaders: false,

    // handler: (req, res) => {
    //   const resetTime = req.rateLimit.resetTime;
    //   let retryAfterSeconds = 0;

    //   if (resetTime) {
    //     retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);
    //   }

    //   return res.status(429).json({
    //     success: false,
    //     message: `Too many requests. Try again after ${retryAfterSeconds} seconds.`,
    //     retry_after_seconds: retryAfterSeconds,
    //     limit: req.rateLimit.limit,
    //   });
    // },
    handler: (req, res) => {
        const resetTime = req.rateLimit.resetTime;
        let retryAfterSeconds = 0;
      
        if (resetTime) {
          retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);
        }
      
        // --- Human readable time formatting ---
        let readableTime = "";
      
        if (retryAfterSeconds < 60) {
          readableTime = `${retryAfterSeconds} second${retryAfterSeconds > 1 ? "s" : ""}`;
        } else if (retryAfterSeconds < 3600) {
          const minutes = Math.ceil(retryAfterSeconds / 60);
          readableTime = `${minutes} minute${minutes > 1 ? "s" : ""}`;
        } else {
          const hours = Math.ceil(retryAfterSeconds / 3600);
          readableTime = `${hours} hour${hours > 1 ? "s" : ""}`;
        }
      
        return res.status(429).json({
          success: false,
          message: `Too many requests. Try again after ${readableTime}.`,
          retry_after_seconds: retryAfterSeconds,
          limit: req.rateLimit.limit,
        });
      }
      
  });

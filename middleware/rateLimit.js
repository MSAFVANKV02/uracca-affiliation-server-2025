import rateLimit from "express-rate-limit";

/**
 * Create custom rate limiter per route
 * @param {number} windowMs - time window in ms
 * @param {number} max - max requests in window
 */
export const createLimiter = (windowMs, max) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

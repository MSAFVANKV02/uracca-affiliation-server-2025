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
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  });

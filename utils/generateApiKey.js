import crypto from "crypto";

export const generateApiKey = () => {
  const random = crypto.randomBytes(16).toString("hex").toUpperCase();
  return `PLAT-${random}`;
};

import dns from "dns";
import url from "url";

/**
 * Extracts clean domain name and base name for conflict checking
 * Example:
 *   https://admin.uracca.com → { name: "admin.uracca", base: "uracca" }
 *   https://www.uracca.com → { name: "uracca", base: "uracca" }
 */
// export const ExtractDomainParts = (fullUrl) => {
//   const parsed = new URL(fullUrl);
//   const hostname = parsed.hostname.replace(/^www\./, ""); // remove www
//   const parts = hostname.split(".");
//   if (parts.length < 2) throw new Error("Invalid domain format");

//   // name = everything before .tld (e.g. admin.uracca)
//   const name = parts.slice(0, -1).join(".");
//   const base = parts.length >= 2 ? parts[parts.length - 2] : hostname;
//   return { name, base };
// };
export const ExtractDomainParts = (fullUrl) => {
  const parsed = new URL(fullUrl);
  const hostname = parsed.hostname; // preserves "www." if present

  const parts = hostname.split(".");
  if (parts.length < 2) throw new Error("Invalid domain format");

  // name = everything before the final TLD segment
  const name = parts.slice(0, -1).join(".");

  // base = full origin with protocol + // + hostname (preserves www)
  const base = `${parsed.protocol}//${hostname}`;

  return { name, base };
};
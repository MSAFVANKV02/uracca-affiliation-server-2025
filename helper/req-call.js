export function getCookieDomain(req) {
  const origin = req.headers.origin || "";
  let cookieDomain = undefined;

  // If localhost → do NOT set domain
  if (origin.includes("localhost")) {
    return undefined;
  }

  try {
    const url = new URL(origin);
    const hostParts = url.hostname.split(".");

    // Extract top-level + second-level domain: uracca.com
    if (hostParts.length >= 2) {
      cookieDomain = "." + hostParts.slice(-2).join(".");
    }
  } catch (err) {
    console.log("insIde catch of getCookieDomain");

    // fallback to env if parsing fails
    cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  }

  return cookieDomain;
}
// export function getCookieDomain(req) {
//   const origin = req.headers.origin;

//   if (!origin || origin.includes("localhost")) {
//     return undefined;
//   }

//   try {
//     const hostname = new URL(origin).hostname.replace(/^www\./, "");
//     const parts = hostname.split(".");

//     // last domain parts
//     const tld = parts[parts.length - 1];        // in
//     const sld = parts[parts.length - 2];        // uracca

//     // ALWAYS return parent domain
//     return `.${sld}.${tld}`;

//   } catch {
//     return process.env.COOKIE_DOMAIN || undefined;
//   }
// }

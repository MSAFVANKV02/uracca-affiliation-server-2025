// export function getCookieDomain(req) {
//     const origin = req.headers.origin || "";
//     let cookieDomain = undefined;
  
//     // If localhost → do NOT set domain
//     if (origin.includes("localhost")) {
//       return undefined;
//     }
  
//     try {
//       const url = new URL(origin);
//       const hostParts = url.hostname.split(".");
  
//       // Extract top-level + second-level domain: uracca.com
//       if (hostParts.length >= 2) {
//         cookieDomain = "." + hostParts.slice(-2).join(".");
//       }
//     } catch (err) {
//       console.log('insIde catch of getCookieDomain');
      
//       // fallback to env if parsing fails
//       cookieDomain = process.env.COOKIE_DOMAIN || undefined;
//     }
  
//     return cookieDomain;
//   }
export function getCookieDomain(req) {
  const origin = req.headers.origin || "";

  // Do not set cookie domain on localhost
  if (!origin || origin.includes("localhost")) {
    return undefined;
  }

  try {
    const hostname = new URL(origin).hostname;

    // Remove "www."
    const cleanHost = hostname.replace(/^www\./, "");

    const parts = cleanHost.split(".");

    // If domain has <= 2 parts → use it directly (example: uracca.com)
    if (parts.length <= 2) {
      return "." + cleanHost;
    }

    // If TLD is 2 letters (.in, .uk, .us) → support multi-level TLDs
    const last = parts[parts.length - 1];       // "in"
    const secondLast = parts[parts.length - 2]; // "uracca"

    const isCountryTLD = last.length === 2;

    if (isCountryTLD) {
      // Handles .in, .co.in, .net.in, .org.in etc.
      return "." + parts.slice(-3).join(".");
    }

    // Default: last 2 parts (.com, .net)
    return "." + parts.slice(-2).join(".");
  } catch (err) {
    console.log("getCookieDomain() parsing failed:", err.message);
    return process.env.COOKIE_DOMAIN || undefined;
  }
}

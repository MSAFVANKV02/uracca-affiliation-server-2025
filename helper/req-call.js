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

  // Don't set cookie on localhost
  if (!origin || origin.includes("localhost")) {
    return undefined;
  }

  try {
    const hostname = new URL(origin).hostname.replace(/^www\./, "");

    const parts = hostname.split("."); 
    if (parts.length < 2) {
      return undefined;
    }

    // Always return last 2 parts
    const cookieDomain = "." + parts.slice(-2).join(".");
    return cookieDomain;

  } catch (err) {
    return process.env.COOKIE_DOMAIN || undefined;
  }
}


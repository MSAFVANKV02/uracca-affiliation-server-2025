import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AffUser from "../../models/aff-user.js";
import { Platform } from "../../models/platformSchema.js";
import { ExtractDomainParts } from "../../helper/domain-existence.js";

import Domains from "../../models/domainSchema.js";
import { getCookieDomain } from "../../helper/req-call.js";

const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "supersecretkey";

/**
 * REGISTER USER
 */
// import validator from "validator";

export const registerUser = async (req, res) => {
  try {
    const { mobile, password, email, domain: domainUrl, type } = req.body;

    if (!mobile || !password || !email || !domainUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if SUPER_ADMIN already exists
    if (type === "SUPER_ADMIN") {
      const existingSuperAdmin = await AffUser.findOne({
        userType: "SUPER_ADMIN",
      });
      if (existingSuperAdmin) {
        return res.status(403).json({
          message:
            "A SUPER_ADMIN account already exists. Registration not allowed.",
        });
      }
    }

    // ✅ Check for existing email or mobile
    const existingUser = await AffUser.findOne({
      $or: [{ email }, { mobile }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: "Email already registered" });
      }
      if (existingUser.mobile === mobile) {
        return res
          .status(400)
          .json({ message: "Mobile number already registered" });
      }
    }

    // ✅ Validate domain format
    const domainPattern =
      /^(https?:\/\/)([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)(\.[a-z]{2,})(\/)?$/;
    if (!domainPattern.test(domainUrl)) {
      return res.status(400).json({
        message:
          "Invalid domain format. Example: https://www.uracca.com or https://admin.uracca.in",
      });
    }

    // ✅ Extract domain parts
    const { name: domainName, base: baseDomain } =
      ExtractDomainParts(domainUrl);

    // ✅ Check for conflicting domains
    const allDomains = await Domains.find({}, { name: 1, url: 1 });

    const isConflict = allDomains.some((d) => {
      if (!d.name) return false;

      const existingParts = d.name.split(".");
      const newParts = domainName.split(".");

      return (
        d.name === domainName ||
        d.name.endsWith(`.${domainName}`) ||
        domainName.endsWith(`.${d.name}`) ||
        existingParts.includes(baseDomain) ||
        newParts.includes(baseDomain)
      );
    });

    if (isConflict) {
      return res.status(400).json({
        message: "This or a related subdomain/base domain already exists.",
      });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create Domain first
    const newDomain = new Domains({
      registeredUserId: null, // will update after creating user
      name: domainName,
      url: domainUrl,
    });
    // await newDomain.save();

    // ✅ Create User with domain ObjectId
    const newUser = new AffUser({
      mobile,
      email,
      password: hashedPassword,
      userType: type || "ADMIN",
      status: type === "SUPER_ADMIN" ? "APPROVED":"PENDING",
      userName: domainName,
      domain: newDomain._id, // assign ObjectId
    });
    await newUser.save();

    // ✅ Update Domain with registeredUserId
    newDomain.registeredUserId = newUser._id;
    await newDomain.save();

    // ✅ Create Platform entry
    const platform = new Platform({
      adminId: newUser._id,
      adminType: type || "ADMIN",
      domain: domainUrl,
    });
    await platform.save();

    return res.status(201).json({
      message: "Registration successful",
      user: newUser,
      platform,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};


// export const registerUser = async (req, res) => {
//   try {
//     const { mobile, password, email, domain: domainUrl, type } = req.body;

//     if (!mobile || !password || !email || !domainUrl) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // ✅ Check if SUPER_ADMIN already exists
//     if (type === "SUPER_ADMIN") {
//       const existingSuperAdmin = await AffUser.findOne({
//         userType: "SUPER_ADMIN",
//       });
//       if (existingSuperAdmin) {
//         return res.status(403).json({
//           message:
//             "A SUPER_ADMIN account already exists. Registration not allowed.",
//         });
//       }
//     }

//     // ✅ Check for existing email or mobile
//     const existingUser = await AffUser.findOne({
//       $or: [{ email }, { mobile }],
//     });

//     if (existingUser) {
//       if (existingUser.email === email) {
//         return res.status(400).json({ message: "Email already registered" });
//       }
//       if (existingUser.mobile === mobile) {
//         return res
//           .status(400)
//           .json({ message: "Mobile number already registered" });
//       }
//     }

//     // ✅ Validate domain format
//     const domainPattern =
//       /^(https?:\/\/)([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*)(\.[a-z]{2,})(\/)?$/;
//     if (!domainPattern.test(domainUrl)) {
//       return res.status(400).json({
//         message:
//           "Invalid domain format. Example: https://www.uracca.com or https://admin.uracca.in",
//       });
//     }

//     // ✅ Extract domain parts
//     const { name: domainName, base: baseDomain } =
//       ExtractDomainParts(domainUrl);

//     // ✅ Check for conflicting domains
//     const allDomains = await AffUser.find(
//       {},
//       { "domain.name": 1, "domain.url": 1 }
//     );

//     const isConflict = allDomains.some((d) => {
//       if (!d.domain?.name) return false;

//       const existing = d.domain.name;
//       const existingParts = existing.split(".");
//       const newParts = domainName.split(".");

//       // Conflicts if:
//       // 1. base name matches (e.g. uracca vs admin.uracca)
//       // 2. new or existing contains the other as a subdomain
//       return (
//         existing === domainName ||
//         existing.endsWith(`.${domainName}`) ||
//         domainName.endsWith(`.${existing}`) ||
//         existingParts.includes(baseDomain) ||
//         newParts.includes(baseDomain)
//       );
//     });

//     if (isConflict) {
//       return res.status(400).json({
//         message: "This or a related subdomain/base domain already exists.",
//       });
//     }

//     // ✅ Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // ✅ Create user
//     const newUser = new AffUser({
//       mobile,
//       email,
//       password: hashedPassword,
//       userType: type || "ADMIN",
//       userName: domainName,
//       domain: { name: domainName, url: domainUrl },
//     });

//     await newUser.save();

//     // ✅ Create Platform entry
//     const platform = new Platform({
//       adminId: newUser._id,
//       adminType: type || "ADMIN",
//       domain: domainUrl,
//     });
//     await platform.save();

//     return res.status(201).json({
//       message: "Registration successful",
//       user: newUser,
//       platform,
//     });
//   } catch (error) {
//     console.error("Register Error:", error);
//     return res.status(500).json({
//       message: "Server error during registration",
//       error: error.message,
//     });
//   }
// };

/**
 * LOGIN USER
 */
export const loginUser = async (req, res) => {
  try {
    const { mobile, password, domain } = req.body;

    if (!mobile || !password) {
      return res
        .status(400)
        .json({ message: "Mobile and password are required" });
    }

    // Find user
    const user = await AffUser.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.userType === "USER") {
      return res.status(404).json({ message: "Cant login with this account" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid mobile or password" });
    }

    // Generate JWT token
    const payload = {
      adminId: user._id,
      mobile: user.mobile,
      email: user.email,
      domain: domain || user.domain,
    };

    const token = jwt.sign(payload, JWT_SECRET_ADMIN, { expiresIn: "7d" });
    const cookieDomain = getCookieDomain(req);
    // Set cookie
    res.cookie("aff-admin-tkn", token, {
      // domain:process.env.NODE_ENV !== "development" &&".uracca",
      // httpOnly: process.env.NODE_ENV !== "development",
      // secure: process.env.NODE_ENV === "production",
      // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: req.headers.origin?.startsWith("https://"),
      domain:cookieDomain,
      sameSite: "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Find related platform
    const platform = await Platform.findOne({
      adminId: user._id,
      domain: domain || user.domain,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
      platform,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

// export const login = async (req, res) => {
//   try {
//     const { mobile, password, email, domain, type } = req.body;

//     if (!mobile) {
//       return res.status(400).json({ message: "Mobile is required" });
//     }

//     // 1️⃣ Find user by mobile
//     let user = await AffUser.findOne({ mobile });
//     let platform;
//     // 2️⃣ If no user exists
//     if (!user) {
//       // If email, domain, and password provided, create new user
//       if (email && domain && password) {
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Extract domain name for userName
//         let normalizedDomainForUserName = domain.replace(/(^\w+:|^)\/\//, ""); // remove http/https
//         normalizedDomainForUserName = normalizedDomainForUserName.replace(
//           /^www\./,
//           ""
//         ); // remove www
//         normalizedDomainForUserName = normalizedDomainForUserName.split(".")[0]; // take first part

//         let normalizedDomain = domain;
//         if (domain && normalizedDomain.endsWith("/")) {
//           normalizedDomain = normalizedDomain.slice(0, -1);
//         }

//         // Normalize domain: remove trailing slash if exists

//         // 4️⃣ Check if platform exists for this admin and domain
//         platform = await Platform.findOne({
//           domain: normalizedDomain,
//           adminId: user._id,
//         });
//         if (!platform) {
//           platform = new Platform({ adminId: user._id, adminType: type });
//           await platform.save();
//         }

//         user = new AffUser({
//           mobile,
//           email,
//           password: hashedPassword,
//           userType: type || "ADMIN",
//           userName: normalizedDomainForUserName,
//           domain: normalizedDomain,
//         });
//         await user.save();
//       } else {
//         // Otherwise, return registration false
//         return res
//           .status(403)
//           .json({ message: "User Not Found", registration: false });
//       }
//     } else {
//       // 3️⃣ If user exists, verify password
//       const isMatch = await bcrypt.compare(password, user.password || "");
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid mobile or password" });
//       }
//     }

//     // 5️⃣ Generate JWT token
//     const payload = {
//       adminId: user._id,
//       mobile,
//       email,
//       domain: domain,
//     };
//     const token = jwt.sign(payload, JWT_SECRET_ADMIN, { expiresIn: "7d" });

//     // 6️⃣ Set cookie
//     res.cookie("aff-admin-tkn", token, {
//       httpOnly: false,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     // 7️⃣ Update userType if provided
//     if (type && user.userType !== type) {
//       user.userType = type;
//       await user.save();
//     }

//     return res.status(200).json({
//       message: "Login successful",
//       token,
//       user,
//       platform,
//     });
//   } catch (error) {
//     console.error(error);
//     return res
//       .status(500)
//       .json({ message: "Server error", error: error.message });
//   }
// };

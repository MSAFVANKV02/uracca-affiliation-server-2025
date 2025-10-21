import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AffUser from "../../models/aff-user.js";
import { Platform } from "../../models/platformSchema.js";

const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "supersecretkey";

export const login = async (req, res) => {
  try {
    const { mobile, password, email, domain, type } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile is required" });
    }

    // 1️⃣ Find user by mobile
    let user = await AffUser.findOne({ mobile });

    // 2️⃣ If no user exists
    if (!user) {
      // If email, domain, and password provided, create new user
      if (email && domain && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new AffUser({
          mobile,
          email,
          password: hashedPassword,
          userType: type || "ADMIN",
        });
        await user.save();
      } else {
        // Otherwise, return registration false
        return res.status(403).json({message: "User Not Found", registration: false });
      }
    } else {
      // 3️⃣ If user exists, verify password
      const isMatch = await bcrypt.compare(password, user.password || "");
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid mobile or password" });
      }
    }

    // Normalize domain: remove trailing slash if exists
let normalizedDomain = domain;
if (normalizedDomain.endsWith("/")) {
  normalizedDomain = normalizedDomain.slice(0, -1);
}


    // 4️⃣ Check if platform exists for this admin and domain
    let platform = await Platform.findOne({ domain:normalizedDomain, adminId: user._id });
    if (!platform) {
      platform = new Platform({ domain, adminId: user._id });
      await platform.save();
    }

    // 5️⃣ Generate JWT token
    const payload = { adminId: user._id, mobile, email, domain: normalizedDomain };
    const token = jwt.sign(payload, JWT_SECRET_ADMIN, { expiresIn: "7d" });

    // 6️⃣ Set cookie
    res.cookie("aff-admin-tkn", token, {
        httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7️⃣ Update userType if provided
    if (type && user.userType !== type) {
      user.userType = type;
      await user.save();
    }

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
      platform,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// import jwt from "jsonwebtoken";
// import AffUser from "../../models/aff-user.js";
// import { Platform } from "../../models/platformSchema.js";

// // JWT secret (set in env ideally)
// const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "supersecretkey";

// export const login = async (req, res) => {
//   try {
//     const { mobile, password, email, domain, type } = req.body;

//     if (!mobile || !password) {
//       return res.status(400).json({ message: "Mobile and domain are required" });
//     }

//     // 1️⃣ Find user by mobile
//     let user = await AffUser.findOne({ mobile });

//     // 2️⃣ If no user, create new
//     if (!user) {
//       user = new AffUser({
//         mobile,
//         email: email || "",
//         userType: type || "ADMIN",
//       });
//       await user.save();
//     }

//     // 3️⃣ Check if platform with domain already exists
//     const existingPlatform = await Platform.findOne({ domain });
//     if (existingPlatform) {
//       return res.status(400).json({ message: "Platform with this domain already exists" });
//     }

//     // 4️⃣ Create new platform for this domain
//     const platform = new Platform({ domain,adminId: user._id, });
//     await platform.save();

//     // 5️⃣ Generate token with mobile, email, domain
//     const payload = { adminId: user._id, mobile, email, domain };
//     const token = jwt.sign(payload, JWT_SECRET_ADMIN, { expiresIn: "7d" });

//     // 6️⃣ Set cookie
//     res.cookie("aff-admin-tkn", token, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });

//     // 7️⃣ Update userType if type provided
//     if (type) {
//       user.userType = type;
//       await user.save();
//     }

//     return res.status(200).json({
//       message: "Login successful and platform created",
//       token,
//       user,
//       platform,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import AffUser from "../../models/aff-user.js";
import { Platform } from "../../models/platformSchema.js";
import { ExtractDomainParts } from "../../helper/domain-existence.js";

import Domains from "../../models/domainSchema.js";
import { getCookieDomain } from "../../helper/req-call.js";
import { NotFoundError, UnauthorizedError } from "../../utils/errors.js";
import { NpmPackage } from "../../models/npmSchema.js";
import { generateApiKey } from "../../utils/generateApiKey.js";

const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || "supersecretkey";
const JWT_SECRET_USER = process.env.JWT_SECRET_USER || "supersecretkey";
/**
 * REGISTER USER
 */
// import validator from "validator";

export const registerUser = async (req, res) => {
  try {
    const { mobile, password, email, domain: domainUrl, type } = req.body;

    let userType = type || "ADMIN";

    if (!mobile || !password || !email || !domainUrl) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Check if SUPER_ADMIN already exists
    if (type === "SUPER_ADMIN") {
      const existingSuperAdmin = await AffUser.findOne({
        userType: "SUPER_ADMIN",
      });
      // if (existingSuperAdmin) {
      //   // return res.status(403).json({
      //   //   message:
      //   //     "A SUPER_ADMIN account already exists. Registration not allowed.",
      //   // });
      // }
      if (existingSuperAdmin) {
        if (type === "SUPER_ADMIN") {
          console.log(
            "⚠ SUPER_ADMIN already exists → updating this user to ADMIN"
          );
        }
        userType = "ADMIN"; // force admin
      } else {
        // No super admin exists yet → allow the first one to be SUPER_ADMIN
        if (type !== "SUPER_ADMIN") {
          userType = "ADMIN";
        }
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
        message: `Invalid domain:${domainUrl} format. Example: https://www.uracca.com or https://admin.uracca.in`,
      });
    }

    // ✅ Extract domain parts
    const { name: domainName, base: baseDomain } =
      ExtractDomainParts(domainUrl);

    // ✅ Check for conflicting domains
    const allDomains = await Domains.find({}, { name: 1, url: 1 });

    // const isConflict = allDomains.some((d) => {
    //   if (!d.name) return false;

    //   const existingParts = d.name.split(".");
    //   const newParts = domainName.split(".");

    //   return (
    //     d.name === domainName ||
    //     d.name.endsWith(`.${domainName}`) ||
    //     domainName.endsWith(`.${d.name}`) ||
    //     existingParts.includes(baseDomain) ||
    //     newParts.includes(baseDomain)
    //   );
    // });
    const isConflict = allDomains.some((d) => {
      if (!d.name) return false;

      const existing = d.name; // stored: admin.uracca or uracca
      const newDomain = domainName; // extracted from input
      const sameBase = baseDomain === existing.split(".").slice(-1)[0];

      return (
        existing === newDomain || // exact match
        existing.endsWith("." + newDomain) || // existing is subdomain of new
        newDomain.endsWith("." + existing) || // new is subdomain of existing
        sameBase // share same base domain
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
      userType: userType,
      status: type === "SUPER_ADMIN" ? "APPROVED" : "PENDING",
      userName: domainName,
      domain: newDomain._id, // assign ObjectId
    });
    await newUser.save();

    // ✅ Update Domain with registeredUserId
    newDomain.registeredUserId = newUser._id;
    await newDomain.save();

    //  create api key  ==================
    // await NpmPackage.create({
    //   platformName: domainName || "",
    //   domain: domainUrl,
    //   apiKey: generateApiKey(),
    // });
    //  ===================================

    // ✅ Create Platform entry
    const platform = new Platform({
      adminId: newUser._id,
      adminType: type || "ADMIN",
      domain: domainUrl,
    });
    await platform.save();

    // 🚀 VERY IMPORTANT PART:
    // Save platformId inside user schema
    newUser.platformId = platform._id;
    await newUser.save();

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

/**
 * LOGIN USER
 */
export const loginAdmin = async (req, res) => {
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

    // console.log(req.headers.origin, "req.headers.origin login--------");

    // Set cookie
    res.cookie("aff-admin-tkn", token, {
      // domain:process.env.NODE_ENV !== "development" &&".uracca",
      // httpOnly: process.env.NODE_ENV !== "development",
      // secure: process.env.NODE_ENV === "production",
      // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: req.headers.origin?.startsWith("https://"),
      domain: cookieDomain,
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

export const loginUser = async (req, res, next) => {
  try {
    const { mobile, password } = req.body;
    const cookieDomain = getCookieDomain(req);

    // Find user
    const user = await AffUser.findOne({ mobile });
    if (!user) {
      // return res.status(404).json({ success: false, message: "User not found" });
      throw new NotFoundError("User not found");
    }

    if (user.status === "BLOCKED") {
      return res
        .status(403)
        .json({ success: false, message: "User has been blocked" });
    }

    // Compare passwords
    const isPassMatch = await bcrypt.compare(password, user.password);
    if (!isPassMatch) {
      throw new UnauthorizedError("Invalid credentials");
      // return res
      //   .status(401)
      //   .json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        name: user.userName,
        email: user.email,
        mobile: user.mobile,
        referralId: user.referralId,
      },
      JWT_SECRET_USER,
      { expiresIn: "7d" }
    );

    // res.cookie("aff_ses_server", token, {
    //   // domain:process.env.NODE_ENV !== "development" &&".uracca",
    //   // httpOnly: process.env.NODE_ENV !== "development",
    //   // secure: process.env.NODE_ENV === "production",
    //   // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    //   secure: req.headers.origin?.startsWith("https://"),
    //   domain: cookieDomain,
    //   sameSite: "Strict",
    //   maxAge: 30 * 24 * 60 * 60 * 1000,
    // });
    res.cookie("aff_ses_server", token, {
      httpOnly: true,
      secure: false, // important for IP
      sameSite: "lax", // important for IP
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 🔥 7 days in ms
      // maxAge: 1 * 60 * 1000, // i min
    });

    // Prepare cookie options
    // const cookie = serialize("aff_ses_server", token, {
    //   httpOnly: true,
    //   secure: true,                // required for cross-site cookies
    //   sameSite: "None",            // required for cross-domain
    //   domain: ".server.uracca.com",       // FIX: cookie works across all subdomains
    //   path: "/",
    //   maxAge: 7 * 24 * 60 * 60,    // 7 days
    // });

    // // Set cookie in response header
    // res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      success: true,
      message: "Successfully Logged In",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
    // console.error("Login error:", error);
    // return res.status(500).json({
    //   success: false,
    //   message: "Internal Server Error",
    // });
  }
};

"use server";
import axios from "axios";
import otpGenerator from "otp-generator";
import nodemailer from "nodemailer";

export const handleOtpSending = async (
  mobile,
  email,
  forwardTo
) => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  // ✅ only send SMS, don’t touch DB here
  if (forwardTo === "email") {
    await sendOtpViaEmail(otp, email);
  } else {
    await sendOtpViaFast2SMS(mobile, otp);
  }

  return otp;
};

const sendOtpViaFast2SMS = async (mobile, otp) => {
  try {
    const options = {
      message: "176527",
      variables_values: otp,
      numbers: [mobile],
      route: "dlt",
      sender_id: process.env.SENDER_ID,
      flash: "0",
      language: "english",
    };

    const response = await axios.get(
      `https://www.fast2sms.com/dev/bulkV2?authorization=${
        process.env.FAST2SMS_API_KEY
      }&route=${options.route}&message=${options.message}&language=${
        options.language
      }&flash=${options.flash}&numbers=${options.numbers.join(",")}&sender_id=${
        options.sender_id
      }&variables_values=${options.variables_values}`
    );

    if (!response.data.return) {
      throw new Error(
        "OTP could not be sent. Please check your mobile number."
      );
    }
  } catch (err) {
    if (err.response?.status === 400) {
      // User mistake (invalid number)
      throw new Error(
        "Invalid mobile number. Please enter a valid 10-digit number."
      );
    }
    // System / API issue
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

// ==== send to email ====
const sendOtpViaEmail = async (otp, email) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT), // Ensure it's a number
    secure: false, // Use `true` if you're using port 465
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Uracca Affiliate" <${process.env.SMTP_MAIL}>`,
    to: email,
    subject: "OTP Verification for Signup",
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center;">
          <h1 style="color: #4CAF50;">Uracca Affiliate - OTP Verification</h1>
          <p style="font-size: 16px; color: #333;">Thank you for choosing <strong>AFFiliate</strong>. Please use the following OTP to complete your registration:</p>
          <h2 style="font-size: 32px; font-weight: bold; color: #4CAF50;">${otp}</h2>
          <p style="font-size: 16px; color: #333;">Enter this OTP on the verification page to proceed.</p>
          <div style="margin-top: 20px; padding: 10px 20px; background-color: #4CAF50; color: white; border-radius: 5px; text-align: center; font-size: 14px;">
            <p style="margin: 0;">If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
  };

  // ✅ 8. Send email
  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to:", email);
  } catch (emailError) {
    console.error("Error sending OTP email:", emailError);
    throw new Error("Failed to send OTP. Please try again later.");
  }
};

// export const handleOtpSending = async (mobile:string) => {
//     const otp = otpGenerator.generate(6, {
//       upperCaseAlphabets: false,
//       lowerCaseAlphabets: false,
//       specialChars: false,
//     });

//     //  console.log("otp", otp);

//     const existingOtp = await User.findOne({ mobile });
//     if (existingOtp) {
//       existingOtp.otp = otp;
//       await existingOtp.save();
//     } else {
//       const otpEntry = new User({ mobile, otp });
//       await otpEntry.save();
//     }

//     await sendOtpViaFast2SMS(mobile, otp);
//   };

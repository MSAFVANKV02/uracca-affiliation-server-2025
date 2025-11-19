import axios from "axios";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;
const auth = { username: key_id, password: key_secret };

// -----------------------------------------------------
// 🔹 VALIDATE UPI ID
// -----------------------------------------------------
export async function validateUpi(upiId) {
  try {
    // 🛑 Razorpay does NOT support real VPA validation in TEST mode
    if (process.env.RAZORPAY_KEY_ID.startsWith("rzp_test")) {
      console.log("⚠️ Skipping UPI validation in TEST mode");
      return { success: true, testMode: true };
    }
    const res = await axios.post(
      "https://api.razorpay.com/v1/payments/validate/vpa",
      { vpa: upiId },
      { auth }
    );

    return {
      success: res.data.success,
      customerName: res.data.customer_name || null,
    };
  } catch (err) {
    console.log(err.response, "validateUpi", "error");

    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
}

// -----------------------------------------------------
// 🔹 VALIDATE BANK ACCOUNT (Penny Drop)
// -----------------------------------------------------
export async function validateBankAccount({ accountNumber, ifsc, name }) {
  try {
    // 🛑 Razorpay does NOT support real VPA validation in TEST mode
    if (process.env.RAZORPAY_KEY_ID.startsWith("rzp_test")) {
      console.log("⚠️ Skipping UPI validation in TEST mode");
      return { success: true, testMode: true };
    }

    const res = await axios.post(
      "https://api.razorpay.com/v1/fund_accounts/validation",
      {
        account_number: accountNumber,
        fund_account: {
          account_type: "bank_account",
          bank_account: {
            name,
            ifsc,
            account_number: accountNumber,
          },
        },
      },
      { auth }
    );

    return {
      success: true,
      status: res.data.status, // completed / failed
      details: res.data,
    };
  } catch (err) {
    console.log(err, "validateBankAccount", "error");

    return {
      success: false,
      error: err.response?.data || err.message,
    };
  }
}

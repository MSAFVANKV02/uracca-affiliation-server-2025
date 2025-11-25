
// import axios from "axios";

// /**
//  * Create or refresh a Razorpay Contact and Fund Account for a user.
//  * @param {Object} user - The user document (must include transactionDetails)
//  * @param {"upi"|"bank"} methodKey - "upi" or "bank"
//  * @returns {Promise<{ contactId: string, fundAccountId: string }>}
//  */
// export async function createRazorpayContactAndFund(user, methodKey) {
//   const key_id = process.env.RAZORPAY_KEY_ID ?? "rzp_test_4YU8jVusTNczuc";
//   const key_secret = process.env.RAZORPAY_KEY_SECRET ?? "b6mKSb0YksLxVzKPiB4nudRl";
//   const auth = { username: key_id, password: key_secret };

//   try {
//     // ✅ Create Contact
//     const contactRes = await axios.post(
//       "https://api.razorpay.com/v1/contacts",
//       {
//         name: user.fullName || user.userName,
//         email: user.email,
//         contact: user.mobile,
//         type: "customer",
//         reference_id: user._id.toString(),
//       },
//       { auth }
//     );

//     // console.log("Contact created:", contactRes.data);


//     const contactId = contactRes.data.id;

//     // ✅ Create Fund Account (UPI or Bank)
//     let fundPayload;
//     if (methodKey === "upi") {
//       fundPayload = {
//         contact_id: contactId,
//         account_type: "vpa",
//         vpa: { address: user.transactionDetails.upiId },
//       };
//     } else {
//       fundPayload = {
//         contact_id: contactId,
//         account_type: "bank_account",
//         bank_account: {
//           name: user.transactionDetails.OnlineBank.accountHolderName,
//           ifsc: user.transactionDetails.OnlineBank.ifscCode,
//           account_number: user.transactionDetails.OnlineBank.accountNumber,
//         },
//       };
//     }

//     const fundRes = await axios.post(
//       "https://api.razorpay.com/v1/fund_accounts",
//       fundPayload,
//       { auth }
//     );

//     const fundAccountId = fundRes.data.id;
//     // console.log(fundRes,'fundRes===');
    
//     // console.log("✅ Created Razorpay contact & fund:", contactId, fundAccountId);

//     return { contactId, fundAccountId };
//   } catch (err) {
//     console.error("❌ Razorpay creation failed:", err.response?.data || err.message);
//     throw new Error("Razorpay Contact/Fund creation failed");
//   }
// }

import axios from "axios";
import { validateUpi, validateBankAccount } from "./razorpayValidation.js";

export async function createRazorpayContactAndFund(user, methodKey) {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  const auth = { username: key_id, password: key_secret };

  try {
    // ------------------------------------------
    // 🔍 Step 1: Validate UPI / Bank BEFORE creating fund_account
    // ------------------------------------------
    if (methodKey === "upi") {
      const upi = user.transactionDetails.upiId;
      const check = await validateUpi(upi);

      if (!check.success) {
        throw new Error(`Invalid UPI ID: ${upi}`);
      }
    } else {
      const bank = user.transactionDetails.OnlineBank;
      const check = await validateBankAccount({
        accountNumber: bank.accountNumber,
        ifsc: bank.ifscCode,
        name: bank.accountHolderName,
      });

      if (!check.success || check.status !== "completed") {
        throw new Error(
          `Invalid bank account or IFSC (${bank.accountNumber} - ${bank.ifscCode})`
        );
      }
    }

    // ------------------------------------------
    // 🔹 Step 2: Create Contact
    // ------------------------------------------
    const contactRes = await axios.post(
      "https://api.razorpay.com/v1/contacts",
      {
        name: user.fullName || user.userName,
        email: user.email,
        contact: user.mobile,
        type: "customer",
        reference_id: user._id.toString(),
      },
      { auth }
    );

    const contactId = contactRes.data.id;

    // ------------------------------------------
    // 🔹 Step 3: Create Fund Account
    // ------------------------------------------
    let fundPayload;
    if (methodKey === "upi") {
      fundPayload = {
        contact_id: contactId,
        account_type: "vpa",
        vpa: { address: user.transactionDetails.upiId },
      };
    } else {
      fundPayload = {
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name: user.transactionDetails.OnlineBank.accountHolderName,
          ifsc: user.transactionDetails.OnlineBank.ifscCode,
          account_number: user.transactionDetails.OnlineBank.accountNumber,
        },
      };
    }

    const fundRes = await axios.post(
      "https://api.razorpay.com/v1/fund_accounts",
      fundPayload,
      { auth }
    );

    return {
      contactId,
      fundAccountId: fundRes.data.id,
    };
  } catch (err) {
    // console.error("❌ Razorpay Validation/Creation failed:", err.response?.data || err.message);
    // throw new Error(err.message ||err.response?.data.description||err.response?.data.message|| "Validation failed");
    const apiErr = err.response?.data?.error;

    const errorMessage =
      apiErr?.description ||
      apiErr?.reason ||
      apiErr?.field ||
      err.response?.data?.message ||
      err.message ||
      "Validation failed";
  
    throw new Error(errorMessage);
  }
}

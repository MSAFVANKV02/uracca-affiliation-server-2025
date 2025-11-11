// import axios from "axios";

// /**
//  * Create a Razorpay Contact and Fund Account for a user.
//  *
//  * @param {Object} user - The user object (must have email, fullName, mobile, transactionDetails)
//  * @returns {Promise<{ contactId: string, fundAccountId: string }>}
//  */
// export async function createRazorpayContactAndFund(user) {
//   const key_id = process.env.RAZORPAY_KEY_ID ?? "rzp_test_4YU8jVusTNczuc";
//   const key_secret = process.env.RAZORPAY_KEY_SECRET ?? "b6mKSb0YksLxVzKPiB4nudRl";

//   const auth = { username: key_id, password: key_secret };

//   try {
//     // ✅ Step 1: Create Contact
//     const contactResponse = await axios.post(
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

//     const contactId = contactResponse.data.id;

//     // ✅ Step 2: Create Fund Account
//     let fundPayload = {};
//     if (user.transactionDetails.method === "UPI") {
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

//     const fundResponse = await axios.post(
//       "https://api.razorpay.com/v1/fund_accounts",
//       fundPayload,
//       { auth }
//     );

//     const fundAccountId = fundResponse.data.id;

//     console.log("✅ Razorpay Contact & Fund Account created:", contactId, fundAccountId);

//     return { contactId, fundAccountId };
//   } catch (error) {
//     console.error("❌ Razorpay Contact/Fund creation failed:", error.response?.data || error.message);
//     throw new Error("Failed to create Razorpay contact/fund account");
//   }
// }
import axios from "axios";

/**
 * Create or refresh a Razorpay Contact and Fund Account for a user.
 * @param {Object} user - The user document (must include transactionDetails)
 * @param {"upi"|"bank"} methodKey - "upi" or "bank"
 * @returns {Promise<{ contactId: string, fundAccountId: string }>}
 */
export async function createRazorpayContactAndFund(user, methodKey) {
  const key_id = process.env.RAZORPAY_KEY_ID ?? "rzp_test_4YU8jVusTNczuc";
  const key_secret = process.env.RAZORPAY_KEY_SECRET ?? "b6mKSb0YksLxVzKPiB4nudRl";
  const auth = { username: key_id, password: key_secret };

  try {
    // ✅ Create Contact
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

    console.log("Contact created:", contactRes.data);


    const contactId = contactRes.data.id;

    // ✅ Create Fund Account (UPI or Bank)
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

    const fundAccountId = fundRes.data.id;
    console.log("✅ Created Razorpay contact & fund:", contactId, fundAccountId);

    return { contactId, fundAccountId };
  } catch (err) {
    console.error("❌ Razorpay creation failed:", err.response?.data || err.message);
    throw new Error("Razorpay Contact/Fund creation failed");
  }
}

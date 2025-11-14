/**
 * Calculates TDS based on commission amount, TDS type, isTdsEnabled and platform settings.
 *
 * @param {number} commissionAmount - Total commission amount
 * @param {string} tdsType - 'LINKED' or 'UNLINKED'
 * @param {object} platform - Platform document with TDS methods
 * @param {boolean} isTdsEnabled - Platform document with TDS methods
 * @returns {{ tdsAmount: number, finalCommission: number }}
 */
export const CalculateTDS = (
  commissionAmount,
  tdsType,
  platform,
  isTdsEnabled
) => {
  if (!platform) throw new Error("Platform data required for TDS calculation");

  // 🔥 If TDS is OFF → Do not deduct anything.
  if (!isTdsEnabled) {
    return {
      tdsAmount: 0,
      finalCommission: commissionAmount,
    };
  }

  const tdsBase =
    tdsType === "LINKED"
      ? platform.tdsLinkedMethods
      : platform.tdsUnLinkedMethods;

  const tdsAmount =
    tdsBase.type === "PERCENT"
      ? (commissionAmount * (tdsBase.amount || 0)) / 100
      : tdsBase.amount || 0;

  const finalCommission = commissionAmount - tdsAmount;

  return { tdsAmount, finalCommission };
};

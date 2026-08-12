/**
 * Money helpers.
 *
 * The API stores and returns prices in the currency's MINOR unit as an integer
 * — ₦5,000 is 500000 kobo. Every supported currency (NGN, USD, GHS, ZAR, KES)
 * has two decimal places, so one divisor covers all of them.
 *
 * Conversion happens only at the edges: forms convert major → minor before
 * sending, display converts minor → major. Nothing in between handles a float.
 */
const MINOR_UNITS = 100;

/** 500000 -> "₦5,000" (cents shown only when they are non-zero). */
export const formatMoney = (minor: number, currency = "NGN"): string => {
  const major = (minor ?? 0) / MINOR_UNITS;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: minor % MINOR_UNITS === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    // Intl throws on an unknown currency code; never break a page over it.
    return `${currency} ${major.toLocaleString()}`;
  }
};

/** "5000" -> 500000. Rounds, so a stray 0.001 cannot become a fraction. */
export const toMinorUnits = (major: string | number): number =>
  Math.round(Number(major) * MINOR_UNITS);

/** 500000 -> 5000, for pre-filling an edit form. */
export const toMajorUnits = (minor: number): number => (minor ?? 0) / MINOR_UNITS;

/** "7" -> "7 days", "1" -> "1 day". */
export const formatDelivery = (days: number): string =>
  `${days} ${days === 1 ? "day" : "days"}`;

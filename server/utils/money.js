/**
 * Server-side money formatting, mirroring client/lib/money.ts.
 *
 * Amounts are stored in the currency's MINOR unit as integers (₦5,000 is
 * 500000 kobo). Every supported currency has two decimal places, so one
 * divisor covers all of them. Used by the email templates, which are the only
 * server-side place money is shown to a human.
 */
const MINOR_UNITS = 100;

/** 500000 -> "NGN 5,000". Cents shown only when non-zero. */
const formatMoney = (minor, currency = "NGN") => {
  const major = (minor ?? 0) / MINOR_UNITS;
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: (minor ?? 0) % MINOR_UNITS === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    // Intl throws on an unknown currency code; never break an email over it.
    return `${currency} ${major.toLocaleString()}`;
  }
};

module.exports = { formatMoney };

const crypto = require("crypto");
const ApiError = require("../utils/ApiError");

/**
 * All communication with Paystack lives here.
 *
 * Nothing in this file is called from a route or controller directly, and
 * nothing outside it knows the secret key exists. Uses Node's global fetch
 * (Node 18+), so no HTTP dependency is added.
 */

/**
 * Overridable only so the integration can be exercised against a local stub in
 * development. Leave unset everywhere else — it must point at Paystack.
 */
const BASE_URL = () => process.env.PAYSTACK_BASE_URL || "https://api.paystack.co";

/** Read at call time so requiring this file never crashes a keyless process. */
const secretKey = () => {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set — cannot reach Paystack");
  }
  return key;
};

/** True when the server is configured to take payments at all. */
const isConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);

/**
 * Paystack accepts only alphanumerics and - . = in a reference, so no
 * underscores. Includes the order id for traceability and random bytes so two
 * attempts in the same millisecond cannot collide.
 */
const generateReference = (orderId) =>
  [
    "stvdio",
    String(orderId),
    Date.now().toString(36),
    crypto.randomBytes(6).toString("hex"),
  ].join("-");

/**
 * One place for every Paystack HTTP call.
 *
 * A network failure or a non-JSON response becomes a 502: the request was
 * valid, our upstream let us down. Paystack's own error message is passed
 * through, but never the key or the raw response.
 */
const request = async (path, { method = "GET", body } = {}) => {
  let response;
  let payload;

  try {
    response = await fetch(`${BASE_URL()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey()}`,
        "Content-Type": "application/json",
      },
      ...(body && { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20000),
    });
    payload = await response.json();
  } catch (error) {
    // Deliberately not logging `error` verbatim — a fetch error can echo the
    // request headers, and those carry the secret key.
    throw new ApiError(502, `Could not reach Paystack: ${error.name}`);
  }

  if (!response.ok || payload?.status !== true) {
    throw new ApiError(
      502,
      payload?.message || `Paystack rejected the request (${response.status})`,
    );
  }

  return payload.data;
};

/**
 * Start a transaction.
 * `amountMinor` is already in the currency's smallest unit — the Order stores
 * it that way, so nothing is multiplied or rounded here.
 */
const initializeTransaction = ({
  email,
  amountMinor,
  currency,
  reference,
  callbackUrl,
  metadata,
}) =>
  request("/transaction/initialize", {
    method: "POST",
    body: {
      email,
      amount: amountMinor,
      currency,
      reference,
      callback_url: callbackUrl,
      metadata,
    },
  });

/** Fetch the authoritative state of a transaction. */
const verifyTransaction = (reference) =>
  request(`/transaction/verify/${encodeURIComponent(reference)}`);

/**
 * Confirm a webhook really came from Paystack.
 *
 * HMAC SHA512 of the *raw* request body keyed with the secret. Compared with
 * timingSafeEqual so a wrong signature cannot be discovered byte by byte from
 * response timings.
 */
const verifyWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature) return false;

  const expected = crypto
    .createHmac("sha512", secretKey())
    .update(rawBody)
    .digest("hex");

  const given = Buffer.from(String(signature), "utf8");
  const mine = Buffer.from(expected, "utf8");

  // timingSafeEqual throws on a length mismatch, which is itself a rejection.
  if (given.length !== mine.length) return false;
  return crypto.timingSafeEqual(given, mine);
};

module.exports = {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
  generateReference,
  isConfigured,
};

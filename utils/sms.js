import dotenv from "dotenv";
import twilio from "twilio";
dotenv.config();

let twilioClient = null;

export function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error(
      "Twilio env vars missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN"
    );
  }
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return twilioClient;
}

/**
 * Send an SMS using Twilio
 * @param {string} to E.164 phone number, e.g. "+15551234567"
 * @param {string} body Message text
 */
export async function sendSms(to, body) {
  const toE164 = normalizeToE164(to);
  const client = getTwilioClient();
  const from =
    process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (!from) {
    throw new Error(
      "Set TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID in environment"
    );
  }

  const params = { to: toE164, body };
  if (from.startsWith("MG")) {
    params.messagingServiceSid = from; // Messaging Service SID
  } else {
    params.from = from; // Phone number
  }

  const res = await client.messages.create(params);
  return res?.sid;
}

function normalizeToE164(input) {
  const raw = String(input || "").replace(/\s+/g, "");
  const e164Regex = /^\+\d{8,15}$/; // E.164 valid length
  if (e164Regex.test(raw)) return raw;

  const digitsOnly = raw.replace(/\D/g, "");
  const cc = process.env.SMS_DEFAULT_COUNTRY_CODE || "+91";
  if (/^\d{10}$/.test(digitsOnly)) {
    return `${cc}${digitsOnly}`;
  }
  throw new Error(
    "Invalid phone number format. Provide E.164 (+15551234567) or 10-digit local number"
  );
}

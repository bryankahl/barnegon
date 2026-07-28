import fetch from "node-fetch";
import twilio from "twilio";
import * as logger from "firebase-functions/logger";

export const sendResendLeadEmail = async ({ bizEmail, displayName, leadHTML, notifyEmail, businessId }) => {
  if (notifyEmail && bizEmail) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Barnegon <support@barnegon.com>",
        to: bizEmail,
        subject: "New Lead Captured via Barnegon",
        html: `
          <div style="border: 1px solid #ccc; padding: 20px; border-radius: 8px; font-family: Arial, sans-serif; background-color: #fafafa;">
            <h2 style="color: #6b1f6a;">You've got a new lead!</h2>
            <p><span style="font-size: 16px; font-weight: bold; color: #6c0;">Form:</span> ${displayName}</p>
            ${leadHTML}
          </div>
        `,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API Error: ${errorText}`);
    }
    logger.info("resend_email_sent", { bizEmail });
  } else if (!notifyEmail) {
    logger.info("email_notifications_disabled_by_user");
  } else if (!bizEmail) {
    logger.warn("missing_email_for_business", { businessId });
  }
};

export const sendTwilioLeadSms = async ({ bizPhone, displayName, leadText, notifySMS, businessId }) => {
  if (notifySMS && bizPhone) {
    try {
      const twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      const smsBody = `📩 New lead on Barnegon!\nForm: ${displayName}${leadText}`;
      await twilioClient.messages.create({
        body: smsBody,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: bizPhone
      });
      logger.info("twilio_sms_sent", { bizPhone });
    } catch (smsErr) {
      logger.error("twilio_sms_send_error", { error: smsErr.message || smsErr });
    }
  } else if (!notifySMS) {
    logger.info("sms_notifications_disabled_by_user");
  } else if (!bizPhone) {
    logger.warn("missing_phone_for_business", { businessId });
  }
};

export const sendDirectSms = async ({ to, message }) => {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    logger.info("direct_sms_sent", { sid: result.sid }); 
    return { success: true };
  } catch (err) {
    logger.error("direct_sms_send_error", { error: err.message || err }); 
    throw new Error("Failed to send SMS");
  }
};
import sgMail from "@sendgrid/mail";

// We keep the old function name 'initNodemailer' so we don't break app.js,
// but now it just initializes SendGrid.
export const initNodemailer = async () => {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ SENDGRID_API_KEY is not set in environment variables.");
    } else {
      sgMail.setApiKey(apiKey);
      console.log("🟢 SendGrid initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize SendGrid:", error);
    process.exit(1);
  }
};

export const sendEmail = async (to, subject, text, html) => {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SendGrid API key not initialized. Please set SENDGRID_API_KEY.");
  }

  const msg = {
    to,
    from: process.env.EMAIL_FROM || "no-reply@yourdomain.com", // This MUST be a verified sender in SendGrid
    subject,
    text,
    html,
  };

  try {
    const response = await sgMail.send(msg);
    console.log(`📧 Message sent via SendGrid! Status: ${response[0].statusCode}`);
  } catch (error) {
    console.error("Failed to send email via SendGrid:");
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};


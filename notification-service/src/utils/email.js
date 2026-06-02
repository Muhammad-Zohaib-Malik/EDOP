import { Resend } from "resend";

export const initEmailService = () => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY is not set in environment variables.");
  } else {
    console.log("🟢 Email Service (Resend) initialized");
  }
};

export const sendEmail = async (to, subject, text, html) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not initialized. Please check credentials.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const mailOptions = {
    from: process.env.EMAIL_FROM || "onboarding@resend.dev", // Resend default for testing
    to,
    subject,
    text,
    html,
  };

  try {
    const data = await resend.emails.send(mailOptions);
    if (data.error) {
      throw data.error;
    }
    console.log(`📧 Message sent via Resend! Message ID: ${data.data.id}`);
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    throw error;
  }
};

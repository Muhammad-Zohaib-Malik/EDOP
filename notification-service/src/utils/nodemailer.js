import nodemailer from "nodemailer";

let transporter;

export const initNodemailer = async () => {
  try {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn("⚠️ SMTP credentials are not fully set in environment variables.");
    } else {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port == 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      
      // verify connection configuration
      await transporter.verify();
      console.log("🟢 Nodemailer initialized successfully");
    }
  } catch (error) {
    console.error("Failed to initialize Nodemailer:", error);
    // Don't exit the process, allow the server to start even if email fails
  }
};

export const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    throw new Error("Nodemailer not initialized. Please check SMTP credentials.");
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@yourdomain.com",
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Message sent via Nodemailer! Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("Failed to send email via Nodemailer:", error);
    throw error;
  }
};

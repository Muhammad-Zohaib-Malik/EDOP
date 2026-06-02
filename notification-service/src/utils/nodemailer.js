import nodemailer from "nodemailer";
import dns from "dns";

// Force Node.js to use IPv4 instead of IPv6 for DNS resolution
// This fixes the 'ENETUNREACH 2607:f8b0:...' error on Render and other cloud providers
// that don't have properly configured outbound IPv6 routing.
dns.setDefaultResultOrder("ipv4first");

let transporter;

export const initNodemailer = async () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === "465", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log("🟢 Nodemailer transporter initialized");
  } catch (error) {
    console.error("Failed to initialize Nodemailer:", error);
    process.exit(1);
  }
};

export const sendEmail = async (to, subject, text, html) => {
  if (!transporter) {
    throw new Error("Nodemailer transporter not initialized");
  }
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"EDOP Ecommerce" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
  console.log(`📧 Message sent: ${info.messageId}`);

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`Preview URL: ${previewUrl}`);
  }
};


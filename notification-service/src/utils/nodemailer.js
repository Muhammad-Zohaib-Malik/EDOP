import nodemailer from "nodemailer";

let transporter;

export const initNodemailer = async () => {
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("🟢 Nodemailer transporter initialized");
  } catch (error) {
    console.error("Failed to initialize Nodemailer:", error);
    process.exit(1);
  }
};

export const sendEmail = async (to, subject, text, html) => {
  try {
    if (!transporter) {
      console.error("Nodemailer transporter not initialized");
      return;
    }
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    console.log(`📧 Message sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
};

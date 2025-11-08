import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configure transporter with timeout settings
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter verification failed:", error.message);
  } else {
    console.log("✅ Email transporter is ready to send emails");
  }
});

export const sendOtpMail = async (to, otp) => {
  try {
    console.log(`📧 Sending password reset OTP to: ${to}`);
    const info = await transporter.sendMail({
      from: `"LocaLink" <${process.env.EMAIL}>`,
      to,
      subject: "Reset Your Password",
      html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });
    console.log("✅ Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error.message);
    throw error;
  }
};

export const sendVerificationOtpMail = async (to, otp, type = "email") => {
  try {
    console.log(`📧 Sending verification OTP to: ${to}`);
    const info = await transporter.sendMail({
      from: `"LocaLink" <${process.env.EMAIL}>`,
      to,
      subject: `Verify Your ${type === "email" ? "Email" : "Phone Number"}`,
      html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Verify Your ${
                  type === "email" ? "Email" : "Phone Number"
                }</h2>
                <p>Thank you for registering with LocaLink. Please use the following verification code to complete your registration:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                    <h1 style="color: #4CAF50; margin: 0; font-size: 32px;">${otp}</h1>
                </div>
                <p>This code will expire in 5 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this verification, please ignore this email.</p>
            </div>
        `,
    });
    console.log("✅ Verification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error.message);
    console.error("Error code:", error.code);
    throw error;
  }
};

export const sendDeliveryOtpMail = async (user, otp) => {
  try {
    console.log(`📧 Sending delivery OTP to: ${user.email}`);
    const info = await transporter.sendMail({
      from: `"LocaLink" <${process.env.EMAIL}>`,
      to: user.email,
      subject: "Delivery OTP",
      html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`,
    });
    console.log("✅ Delivery OTP email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send delivery OTP email:", error.message);
    throw error;
  }
};

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  service: "Gmail",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to,
    subject: "Reset Your Password",
    html: `<p>Your OTP for password reset is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });
};

export const sendVerificationOtpMail = async (to, otp, type = "email") => {
  await transporter.sendMail({
    from: process.env.EMAIL,
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
};

export const sendDeliveryOtpMail = async (user, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "Delivery OTP",
    html: `<p>Your OTP for delivery is <b>${otp}</b>. It expires in 5 minutes.</p>`,
  });
};

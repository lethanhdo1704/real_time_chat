// backend/utils/email.js
import nodemailer from "nodemailer";

export const sendOTPEmail = async (to, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Gmail gửi đi
      pass: process.env.EMAIL_PASS, // App password nếu bật 2FA
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "OTP Verification",
    html: `<p>Your OTP code is: <b>${otp}</b></p><p>Valid for 5 minutes</p>`,
  };

  await transporter.sendMail(mailOptions);
};

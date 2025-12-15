import mongoose from "mongoose";

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },

  otp: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // ⭐ TỰ XÓA
  },
}, { timestamps: true });

export default mongoose.model("OTP", OTPSchema);

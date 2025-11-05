import mongoose from "mongoose";

const signupVerificationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String },
    mobile: { type: String },

    emailOtp: { type: String },
    emailOtpExpires: { type: Date },
    emailVerified: { type: Boolean, default: false },

    mobileOtp: { type: String },
    mobileOtpExpires: { type: Date },
    mobileVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Optional TTL index to auto-cleanup after 1 day
signupVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const SignupVerification = mongoose.model(
  "SignupVerification",
  signupVerificationSchema
);

export default SignupVerification;

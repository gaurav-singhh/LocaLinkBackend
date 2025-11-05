import express from "express";
import {
  googleAuth,
  resetPassword,
  sendOtp,
  signIn,
  signOut,
  signUp,
  verifyOtp,
  sendVerificationOtp,
  verifySignupOtp,
} from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);
authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/google-auth", googleAuth);
authRouter.post("/send-verification-otp", sendVerificationOtp);
authRouter.post("/verify-signup-otp", verifySignupOtp);

export default authRouter;

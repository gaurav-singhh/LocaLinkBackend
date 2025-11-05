import express from "express";
import {
  sendVerificationOtp,
  verifySignupOtp,
} from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/send-verification-otp", sendVerificationOtp);
router.post("/verify-signup-otp", verifySignupOtp);

export default router;

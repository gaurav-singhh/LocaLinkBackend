import User from "../models/user.model.js";
import SignupVerification from "../models/signupVerification.model.js";
import bcrypt, { hash } from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail, sendVerificationOtpMail } from "../utils/mail.js";
export const sendVerificationOtp = async (req, res) => {
  try {
    const { email, mobile, type, fullName } = req.body;

    // Basic validations
    if (!fullName)
      return res.status(400).json({ message: "Full name is required" });
    if (type === "email" && !email)
      return res.status(400).json({ message: "Email is required" });
    if (type === "mobile" && !mobile)
      return res.status(400).json({ message: "Mobile number is required" });

    // Format validations
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const mobileRegex = /^[0-9]{10}$/;
    if (type === "email" && !emailRegex.test(String(email).toLowerCase())) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (type === "mobile" && !mobileRegex.test(String(mobile))) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    // Uniqueness check against existing users
    const exists = await User.findOne({
      [type === "email" ? "email" : "mobile"]:
        type === "email" ? email : mobile,
    });
    if (exists) {
      return res
        .status(400)
        .json({
          message: `${
            type === "email" ? "Email" : "Mobile number"
          } already registered`,
        });
    }

    // Find or create a verification record
    let verification = await SignupVerification.findOne(
      email || mobile
        ? {
            $or: [
              ...(email ? [{ email }] : []),
              ...(mobile ? [{ mobile }] : []),
            ],
          }
        : null
    );
    if (!verification) {
      verification = new SignupVerification({ fullName, email, mobile });
    } else {
      // Keep the most recent values
      verification.fullName = fullName;
      if (email) verification.email = email;
      if (mobile) verification.mobile = mobile;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    if (type === "email") {
      verification.emailOtp = otp;
      verification.emailOtpExpires = expires;
      verification.emailVerified = false;
      await sendVerificationOtpMail(email, otp);
    } else {
      verification.mobileOtp = otp;
      verification.mobileOtpExpires = expires;
      verification.mobileVerified = false;
      // Integrate SMS provider here; for now, log to server console
      console.log(`Signup SMS OTP for ${mobile}: ${otp}`);
    }

    await verification.save();

    return res.status(200).json({
      message: `Verification code sent to your ${type}`,
      type,
      verificationId: verification._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error sending verification: ${error}` });
  }
};

export const verifySignupOtp = async (req, res) => {
  try {
    const { otp, verificationId, type } = req.body;
    const v = await SignupVerification.findById(verificationId);
    if (!v) return res.status(400).json({ message: "Verification not found" });

    const now = new Date();
    if (type === "email") {
      if (
        !v.emailOtp ||
        v.emailOtp !== otp ||
        !v.emailOtpExpires ||
        v.emailOtpExpires < now
      ) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      v.emailVerified = true;
      v.emailOtp = undefined;
      v.emailOtpExpires = undefined;
    } else {
      if (
        !v.mobileOtp ||
        v.mobileOtp !== otp ||
        !v.mobileOtpExpires ||
        v.mobileOtpExpires < now
      ) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      v.mobileVerified = true;
      v.mobileOtp = undefined;
      v.mobileOtpExpires = undefined;
    }
    await v.save();

    return res.status(200).json({
      message: `${type} verified successfully`,
      isEmailVerified: v.emailVerified,
      isMobileVerified: v.mobileVerified,
    });
  } catch (error) {
    return res.status(500).json({ message: `Error verifying OTP: ${error}` });
  }
};

export const signUp = async (req, res) => {
  try {
    const { fullName, email, password, mobile, role, verificationId } =
      req.body;

    // Load verification record and ensure both are verified
    const v = await SignupVerification.findById(verificationId);
    if (!v || !v.emailVerified || !v.mobileVerified) {
      return res.status(400).json({
        message: "Email and mobile verification required",
        isEmailVerified: v?.emailVerified || false,
        isMobileVerified: v?.mobileVerified || false,
      });
    }

    // Ensure submitted email/mobile match verified ones
    if (v.email !== email || v.mobile !== mobile || v.fullName !== fullName) {
      return res
        .status(400)
        .json({ message: "Provided details do not match verified records" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    // Duplicate check again to be safe
    const dup = await User.findOne({ $or: [{ email }, { mobile }] });
    if (dup) return res.status(400).json({ message: "User Already exist." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      mobile,
      role,
      isEmailVerified: true,
      isMobileVerified: true,
    });

    // Clean up the verification record
    await SignupVerification.deleteOne({ _id: v._id });

    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json(`Sign up error: ${error}`);
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "incorrect Password" });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json(`sign In error ${error}`);
  }
};

export const signOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "log out successfully" });
  } catch (error) {
    return res.status(500).json(`sign out error ${error}`);
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();
    await sendOtpMail(email, otp);
    return res.status(200).json({ message: "otp sent successfully" });
  } catch (error) {
    return res.status(500).json(`send otp error ${error}`);
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "invalid/expired otp" });
    }
    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();
    return res.status(200).json({ message: "otp verify successfully" });
  } catch (error) {
    return res.status(500).json(`verify otp error ${error}`);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isOtpVerified) {
      return res.status(400).json({ message: "otp verification required" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isOtpVerified = false;
    await user.save();
    return res.status(200).json({ message: "password reset successfully" });
  } catch (error) {
    return res.status(500).json(`reset password error ${error}`);
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { fullName, email, mobile, role } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        fullName,
        email,
        mobile,
        role,
      });
    }

    const token = await genToken(user._id);
    res.cookie("token", token, {
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.status(200).json(user);
  } catch (error) {
    console.log("Error in googleAuth controller:", error.message);
    return res.status(500).json(`googleAuth error ${error}`);
  }
};

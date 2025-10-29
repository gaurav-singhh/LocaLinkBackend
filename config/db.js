import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.error("Please check:");
    console.error("1. Your MongoDB URL is correct");
    console.error("2. Your IP is whitelisted in MongoDB Atlas");
    console.error("3. Your network connection is stable");
    process.exit(1);
  }
};

export default connectDb;

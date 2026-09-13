const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  // If no valid MongoDB URI, skip DB connection (app runs in mock-auth mode)
  if (!mongoUri || mongoUri.includes("<db_password>") || mongoUri.trim() === "") {
    console.warn("⚠️  MONGODB_URI not configured — running in MOCK AUTH mode (no database).");
    console.warn("   Login will work with hardcoded demo users.");
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn("⚠️  MongoDB Connection Failed:", err.message);
    console.warn("   Falling back to MOCK AUTH mode (no database).");
  }
};

module.exports = connectDB;

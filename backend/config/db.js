const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes("<db_password>") || mongoUri.trim() === "") {
    console.error("❌ MONGODB_URI not set or has placeholder password!");
    console.error("   Please set MONGODB_URI in environment variables.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB Atlas Connection Failed:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;

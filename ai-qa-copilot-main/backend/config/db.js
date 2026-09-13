const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const seedData = require("../scripts/seed");

let mongod = null;

const connectDB = async () => {
  let mongoUri =
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/ai_native_test_platform";

  try {
    console.log("Connecting to MongoDB Atlas...");
    console.log("URI:", mongoUri.replace(/\/\/.*@/, "//****:****@"));

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("========================================");
    console.error("MongoDB Atlas Connection Failed");
    console.error(err);
    console.error("========================================");

    console.log("Starting In-Memory MongoDB...");

    mongod = await MongoMemoryServer.create();

    const memoryUri = mongod.getUri();

    const conn = await mongoose.connect(memoryUri);

    console.log(`Connected to In-Memory MongoDB: ${conn.connection.host}`);

    console.log("Seeding demo data...");

    await seedData(false);
  }
};

process.on("SIGTERM", async () => {
  if (mongod) {
    await mongoose.disconnect();
    await mongod.stop();
  }

  process.exit(0);
});

module.exports = connectDB;

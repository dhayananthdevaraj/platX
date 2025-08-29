// src/utils/db.js
const mongoose = require('mongoose');

let isConnected = false; // Global connection state

const connectDB = async () => {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // ✅ Connection options for handling more requests
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20,          // Allow up to 20 concurrent DB connections
      minPoolSize: 5,           // Keep 5 connections ready in the pool
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is not reachable
      socketTimeoutMS: 45000,   // Close idle sockets after 45s
      family: 4                 // Force IPv4 (avoids DNS issues sometimes)
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn.connection;

  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    isConnected = false;
    throw err;
  }
};

// Handle process termination gracefully
process.on("SIGINT", async () => {
  if (isConnected) {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed on app termination");
  }
  process.exit(0);
});

module.exports = connectDB;

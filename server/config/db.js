const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the MONGODB_URI environment variable.
 * Throws if the variable is missing or the connection fails so that the
 * caller can decide how to shut down.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to server/.env");
  }

  const connection = await mongoose.connect(uri);

  // Log the host only — the URI contains credentials.
  console.log(`MongoDB connected: ${connection.connection.host}`);

  return connection;
};

const disconnectDB = () => mongoose.disconnect();

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, disconnectDB, isDBConnected };

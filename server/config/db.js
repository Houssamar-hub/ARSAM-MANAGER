
import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI must be set in server/.env");
  }

  try {
    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

export default connectDB;

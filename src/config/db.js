import mongoose from "mongoose";

const { DB_URI } = process.env; // DB URI should be stored in .env

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected...");
  } catch (err) {
    console.error("Database connection failed", err);
    process.exit(1);
  }
};

export default connectDB;

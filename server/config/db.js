import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Disable Mongoose query buffering so queries fail fast instead of hanging when database is offline
    mongoose.set('bufferCommands', false);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.warn('WARNING: Express server running without active MongoDB connection. Configure your MONGO_URI in server/.env.');
  }
};

export default connectDB;

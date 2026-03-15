import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.error('→ Whitelist your IP in Atlas: https://www.mongodb.com/docs/atlas/security-whitelist/');
    console.error('→ Server will keep running. API will work after MongoDB is connected (restart after fixing).');
    // Don't exit - allow server to run so you can fix Atlas and restart
  }
};

export default connectDB;


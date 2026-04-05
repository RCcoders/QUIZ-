import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Mongoose 7+ deprecation: Use returnDocument: 'after'
mongoose.set('returnDocument', 'after');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('CRITICAL: MONGODB_URI is not defined in environment variables!');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(uri, {
            minPoolSize: 5,
            maxPoolSize: 50,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            waitQueueTimeoutMS: 10000, // Queue the request if pool is exhausted
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;

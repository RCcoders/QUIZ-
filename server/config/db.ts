import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('CRITICAL: MONGODB_URI is not defined in environment variables!');
        console.log('Current process.env keys:', Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('KEY')));
        process.exit(1);
    }

    try {
        // Log truncated URI for debugging (masking credentials)
        const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//****:****@');
        console.log(`Attempting to connect to MongoDB: ${maskedUri}`);

        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${(error as Error).message}`);
        process.exit(1);
    }
};

export default connectDB;

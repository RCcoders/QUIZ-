import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
dotenv.config();
const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || '');
        const users = await User.find({}, 'email role displayName');
        console.log('--- Current Users ---');
        users.forEach(u => console.log(`${u.email} (${u.role}) - ${u.displayName}`));
        await mongoose.connection.close();
    }
    catch (err) {
        console.error(err);
    }
};
listUsers();
//# sourceMappingURL=list-users.js.map
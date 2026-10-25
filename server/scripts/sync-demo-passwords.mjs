import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/modules/auth/user.model.js';
import bcrypt from 'bcryptjs';

async function updatePasswords() {
  try {
    await connectDB();
    const hash = await bcrypt.hash('12345678', 10);
    const emails = ['wahajwahaj200@gmail.com', 'sarah@gmail.com', 'john@gmail.com'];
    
    for (const email of emails) {
      const res = await User.updateOne(
        { email },
        { $set: { passwordHash: hash, mustChangePassword: false, isActive: true } }
      );
      console.log(`Updated ${email}: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }
    
    await disconnectDB();
    console.log('Done updating passwords to 12345678.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updatePasswords();

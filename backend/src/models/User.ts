import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['agent', 'admin'], default: 'agent' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);

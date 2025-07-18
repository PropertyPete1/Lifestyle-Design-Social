import mongoose from 'mongoose';

const CartoonVideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.CartoonVideo || mongoose.model('CartoonVideo', CartoonVideoSchema); 
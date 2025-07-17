import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamMember extends Document {
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'member';
  permissions: Record<string, boolean>;
  invitedBy?: string;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'pending' | 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const teamMemberSchema = new Schema<ITeamMember>({
  teamId: {
    type: String,
    required: true,
    ref: 'Team'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor', 'member'],
    required: true
  },
  permissions: {
    type: Schema.Types.Mixed,
    default: {}
  },
  invitedBy: {
    type: String,
    ref: 'User'
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Create indexes
teamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
teamMemberSchema.index({ teamId: 1, status: 1 });
teamMemberSchema.index({ userId: 1, status: 1 });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', teamMemberSchema); 
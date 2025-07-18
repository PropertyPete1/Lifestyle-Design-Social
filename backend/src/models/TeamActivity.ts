import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamActivity extends Document {
  teamId: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
  createdAt: Date;
}

const teamActivitySchema = new Schema<ITeamActivity>(
  {
    teamId: {
      type: String,
      required: true,
      ref: 'Team',
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    action: {
      type: String,
      required: true,
    },
    resourceType: String,
    resourceId: String,
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Create indexes
teamActivitySchema.index({ teamId: 1, createdAt: -1 });
teamActivitySchema.index({ userId: 1, createdAt: -1 });

export const TeamActivity = mongoose.model<ITeamActivity>('TeamActivity', teamActivitySchema);

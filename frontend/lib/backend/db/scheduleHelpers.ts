import { db } from './connect';

interface ScheduleEntry {
  videoId: string;
  scheduledTime: Date;
  type: 'real_estate' | 'cartoon';
}

export async function insertPostSchedule(entry: ScheduleEntry) {
  await db.collection('schedules').insertOne({
    ...entry,
    createdAt: new Date(),
    status: 'scheduled',
  });
} 
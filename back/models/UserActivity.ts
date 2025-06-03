import { Schema, model, Document, Types } from 'mongoose';

export interface IUserActivity extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  lesson: Types.ObjectId;
  activityType: 'lesson_viewed' | 'lesson_completed' | 'exam_started' | 'exam_completed' | 'code_executed' | 'simulator_used';
  durationSeconds: number;
  metadata: {
    [key: string]: any;
  };
  createdAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  lesson: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  activityType: {
    type: String,
    enum: ['lesson_viewed', 'lesson_completed', 'code_executed', 'simulator_used'],
    required: true
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Índices para consultas eficientes
UserActivitySchema.index({ user: 1, course: 1 });
UserActivitySchema.index({ user: 1, lesson: 1 });
UserActivitySchema.index({ user: 1, activityType: 1 });
UserActivitySchema.index({ course: 1, activityType: 1 });
UserActivitySchema.index({ createdAt: 1 });

export const UserActivity = model<IUserActivity>('UserActivity', UserActivitySchema); 
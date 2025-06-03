import { Schema, model, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  type: 'multiple_choice' | 'text' | 'code';
  text: string;
  lessonId: Types.ObjectId;
  options?: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  codeTemplate?: string;
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

const QuestionSchema = new Schema<IQuestion>({
  type: {
    type: String,
    enum: ['multiple_choice', 'text', 'code'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  codeTemplate: String,
  correctAnswer: String,
  explanation: String,
  points: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

export const Question = model<IQuestion>('Question', QuestionSchema); 
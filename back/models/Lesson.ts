import { Schema, model, Document, Types } from 'mongoose';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

const QuizQuestionSchema = new Schema({
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswerIndex: { type: Number, required: true }
});

// Nuevo esquema para ejercicios de código
export interface CodeTestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

export interface CodeExercise {
  _id?: string | Types.ObjectId; // ID de MongoDB
  id?: string;
  title: string;
  description: string;
  language: string;
  initialCode: string;
  solution: string;
  hint?: string;
  expectedOutput?: string;
  testCases?: CodeTestCase[];
  toObject?: () => any; // Método de MongoDB para convertir a objeto plano
}

const CodeTestCaseSchema = new Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  description: { type: String }
});

const CodeExerciseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  language: { type: String, required: true },
  initialCode: { type: String, required: true },
  solution: { type: String, required: true },
  hint: { type: String },
  expectedOutput: { type: String },
  testCases: { type: [CodeTestCaseSchema], required: false, default: [] }
});

export interface ILesson extends Document {
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  duration?: number; // in minutes
  order: number;
  course: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  quizQuestions?: QuizQuestion[];
  codeExercises?: CodeExercise[]; // Añadido campo para ejercicios de código
  requiredToProgress?: boolean;
  minQuizScore?: number; // Percentage (0-100) required to pass
}

export interface IProgress {
  user: Types.ObjectId | string;
  lesson: Types.ObjectId | string;
  course: Types.ObjectId | string;
  completed: boolean;
  quizScore?: number;
  completedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: false
  },
  duration: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  quizQuestions: {
    type: [QuizQuestionSchema],
    required: false,
    default: []
  },
  codeExercises: {
    type: [CodeExerciseSchema],
    required: false,
    default: []
  },
  requiredToProgress: {
    type: Boolean,
    default: false
  },
  minQuizScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 70
  }
}, {
  timestamps: true
});

// Índices para acelerar consultas comunes
LessonSchema.index({ course: 1, order: 1 }, { unique: true });
LessonSchema.index({ course: 1 });

const ProgressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lesson: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  quizScore: {
    type: Number
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar duplicados
ProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

export const Lesson = model<ILesson>('Lesson', LessonSchema);
export const Progress = model<IProgress>('Progress', ProgressSchema); 
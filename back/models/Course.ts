import { Schema, model, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  instructor: string; // referencia al walletAddress del instructor
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  published: boolean;
  totalDuration?: number; // total duration in minutes
  totalLessons?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
    },
    content: {
      type: String,
      required: [true, 'El contenido es obligatorio']
    },
    imageUrl: {
      type: String,
      default: '/images/default-course.jpg'
    },
    instructor: {
      type: String,
      required: [true, 'El instructor es obligatorio'],
      ref: 'User'
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      default: 0
    },
    level: {
      type: String,
      required: [true, 'El nivel es obligatorio'],
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    tags: {
      type: [String],
      default: []
    },
    published: {
      type: Boolean,
      default: false
    },
    totalDuration: {
      type: Number,
      default: 0
    },
    totalLessons: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const Course = model<ICourse>('Course', CourseSchema);
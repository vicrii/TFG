import { Schema, model, Document, Types } from 'mongoose';
import { ICourse } from './Course';

export interface IEnrollment extends Document {
  user: Types.ObjectId | string;
  course: Types.ObjectId | string | ICourse;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped';
  progress?: number; // Progreso del estudiante en el curso (0-100)
}

const EnrollmentSchema = new Schema<IEnrollment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped'],
    default: 'active'
  }
}, {
  timestamps: true,
  // Permitir propiedades virtuales (como progress) 
  // cuando se convierte a objeto/JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Crear un índice compuesto para que un usuario no pueda inscribirse dos veces al mismo curso
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export const Enrollment = model<IEnrollment>('Enrollment', EnrollmentSchema); 
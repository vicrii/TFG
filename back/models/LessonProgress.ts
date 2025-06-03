import mongoose, { Schema, Document } from 'mongoose';
import { User } from './User';
import { Lesson } from './Lesson';
import { Course } from './Course';

// Interfaz para ejercicios completados
export interface ICompletedExercise {
  exerciseId: string;
  lessonId: string;
  completedAt: Date;
}

export interface ILessonProgress extends Document {
  user: mongoose.Types.ObjectId | string;
  lesson: mongoose.Types.ObjectId | string;
  course: mongoose.Types.ObjectId | string;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number; 
  completedExercises?: ICompletedExercise[];
  // NUEVOS CAMPOS para tracking separado
  quizCompleted: boolean;
  quizCompletedAt?: Date;
  quizScore?: number;
  codeExercisesCompleted: boolean;
  codeExercisesCompletedAt?: Date;
  // Lista de ejercicios de código completados específicamente
  completedCodeExercises?: string[]; // Array de IDs de ejercicios completados
  createdAt: Date;
  updatedAt: Date;
}

const CompletedExerciseSchema = new Schema({
  exerciseId: {
    type: String,
    required: true
  },
  lessonId: {
    type: String,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const LessonProgressSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    completedExercises: {
      type: [CompletedExerciseSchema],
      default: []
    },
    // NUEVOS CAMPOS
    quizCompleted: {
      type: Boolean,
      default: false,
    },
    quizCompletedAt: {
      type: Date,
    },
    quizScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    codeExercisesCompleted: {
      type: Boolean,
      default: false,
    },
    codeExercisesCompletedAt: {
      type: Date,
    },
    completedCodeExercises: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
  }
);

// MIDDLEWARE para calcular `completed` automáticamente basado en lo que requiere la lección
LessonProgressSchema.pre('save', async function(next) {
  if (this.isModified('quizCompleted') || this.isModified('codeExercisesCompleted')) {
    try {
      console.log('🔄 LessonProgress middleware triggered. Current state:', {
        lessonId: this.lesson,
        quizCompleted: this.quizCompleted,
        codeExercisesCompleted: this.codeExercisesCompleted,
        completed: this.completed
      });
      
      // Obtener la lección para saber qué requiere
      const Lesson = mongoose.model('Lesson');
      const lesson = await Lesson.findById(this.lesson);
      
      if (lesson) {
        const hasQuiz = Boolean(lesson.quizQuestions && lesson.quizQuestions.length > 0);
        const hasCodeExercises = Boolean(lesson.codeExercises && lesson.codeExercises.length > 0);
        
        console.log('📚 Lesson requirements:', {
          hasQuiz,
          hasCodeExercises,
          quizQuestionsCount: lesson.quizQuestions?.length || 0,
          codeExercisesCount: lesson.codeExercises?.length || 0
        });
        
        let shouldBeCompleted = false;
        
        if (hasQuiz && hasCodeExercises) {
          // Si tiene ambos, ambos deben estar completados
          shouldBeCompleted = Boolean(this.quizCompleted && this.codeExercisesCompleted);
          console.log('🔄 Both required - shouldBeCompleted:', shouldBeCompleted, 'quizCompleted:', this.quizCompleted, 'codeExercisesCompleted:', this.codeExercisesCompleted);
        } else if (hasQuiz && !hasCodeExercises) {
          // Solo quiz, debe estar completado el quiz
          shouldBeCompleted = Boolean(this.quizCompleted);
          console.log('🎯 Only quiz required - shouldBeCompleted:', shouldBeCompleted, 'quizCompleted:', this.quizCompleted);
        } else if (!hasQuiz && hasCodeExercises) {
          // Solo ejercicios, deben estar completados los ejercicios
          shouldBeCompleted = Boolean(this.codeExercisesCompleted);
          console.log('💻 Only code exercises required - shouldBeCompleted:', shouldBeCompleted, 'codeExercisesCompleted:', this.codeExercisesCompleted);
        } else {
          // No tiene quiz ni ejercicios - lección de solo contenido
          // Se puede marcar como completada manualmente
          shouldBeCompleted = Boolean(this.completed);
          console.log('📖 Content only lesson - keeping current completed status:', shouldBeCompleted);
        }
        
        console.log('🎯 Final calculation - shouldBeCompleted:', shouldBeCompleted, 'current completed:', this.completed);
        
        if (shouldBeCompleted && !this.completed) {
          console.log('✅ Setting lesson as completed!');
          this.completed = true;
          this.completedAt = new Date();
        } else if (!shouldBeCompleted && this.completed) {
          console.log('❌ Setting lesson as NOT completed!');
          this.completed = false;
          this.completedAt = undefined;
        } else {
          console.log('➡️ No change needed in completion status');
        }
      } else {
        console.log('❌ Lesson not found in middleware');
      }
    } catch (error) {
      console.error('❌ Error in LessonProgress pre-save middleware:', error);
    }
  }
  next();
});

// Índice compuesto para búsquedas rápidas
LessonProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });

export const LessonProgress = mongoose.model<ILessonProgress>('LessonProgress', LessonProgressSchema); 
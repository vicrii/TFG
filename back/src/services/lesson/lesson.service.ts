import mongoose from 'mongoose';
import { Lesson, ILesson } from '../../../models/Lesson';
import { LessonProgress as Progress } from '../../../models/LessonProgress';

// Interface para la respuesta de lecciones
export interface LessonData {
  _id: string;
  title: string;
  description: string;
  content: string;
  course: string;
  order: number;
  videoUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  quizQuestions?: Array<{
    _id?: string;
    question: string;
    options: string[];
    correctAnswerIndex: number;
  }>;
  codeExercises?: Array<{
    id?: string;
    title: string;
    description: string;
    language: string;
    initialCode: string;
    solution: string;
    hint?: string;
    expectedOutput?: string;
    isCompleted?: boolean;
  }>;
  isCompleted?: boolean;
  isLocked?: boolean;
  requiredToProgress?: boolean;
  minQuizScore?: number;
  quizCompleted?: boolean;
  quizScore?: number;
  codeExercisesCompleted?: boolean;
  completedCodeExercises?: string[];
}

// Helper para convertir documento de Mongoose a LessonData
const convertToLessonData = (doc: any, userProgress?: any): LessonData => {
  if (!doc) return null as unknown as LessonData;

  // Convertir ejercicios de código si existen
  const codeExercises = doc.codeExercises?.map((exercise: any) => ({
    id: exercise._id.toString(),
    title: exercise.title,
    description: exercise.description,
    language: exercise.language,
    initialCode: exercise.initialCode,
    solution: exercise.solution,
    hint: exercise.hint,
    expectedOutput: exercise.expectedOutput,
    testCases: exercise.testCases?.map((testCase: any)  => ({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      description: testCase.description
    })) || [],
    // Marcar como completado si está en la lista de ejercicios completados
    isCompleted: userProgress?.completedCodeExercises?.includes(exercise._id.toString()) || false
  })) || [];

  // Preparar datos de la lección
  const lessonData: LessonData = {
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    content: doc.content,
    course: doc.course.toString(),
    order: doc.order,
    videoUrl: doc.videoUrl,
    duration: doc.duration,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    quizQuestions: doc.quizQuestions?.map((q: any) => ({
      _id: q._id.toString(),
      question: q.question,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex
    })),
    codeExercises,
    requiredToProgress: doc.requiredToProgress,
    minQuizScore: doc.minQuizScore,
    isCompleted: userProgress?.completed || false,
    isLocked: false,
    quizCompleted: userProgress?.quizCompleted || false,
    quizScore: userProgress?.quizScore,
    codeExercisesCompleted: userProgress?.codeExercisesCompleted || false,
    completedCodeExercises: userProgress?.completedCodeExercises || []
  };

  return lessonData;
};

export class LessonService {
  /**
   * Obtiene todas las lecciones de un curso
   */
  async getCourseLessons(courseId: string, userId?: string): Promise<LessonData[]> {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('ID de curso inválido');
      }

      // Obtener todas las lecciones del curso, ordenadas por el campo 'order'
      const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

      // Si no hay lecciones, devolver array vacío
      if (!lessons || lessons.length === 0) {
        return [];
      }

      // Si hay un userId, obtener el progreso del usuario
      let userProgresses: any[] = [];
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        userProgresses = await Progress.find({
          user: new mongoose.Types.ObjectId(userId),
          course: courseId
        });
        // Crear progreso para lecciones sin progreso
        for (const lesson of lessons) {
          const lessonDoc = lesson as unknown as { _id: mongoose.Types.ObjectId };
          const exists = userProgresses.find(p => p.lesson.toString() === lessonDoc._id.toString());
          if (!exists) {
            const newProgress = new Progress({
              user: new mongoose.Types.ObjectId(userId),
              lesson: lesson._id,
              course: courseId,
              completed: false
            });
            await newProgress.save();
            userProgresses.push(newProgress);
          }
        }
      }

      // Convertir las lecciones a formato de respuesta
      return lessons.map(lesson => {
        const lessonDoc = lesson as unknown as { _id: mongoose.Types.ObjectId };
        const userProgress = userId 
          ? userProgresses.find(p => p.lesson.toString() === lessonDoc._id.toString())
          : null;
        const isCompleted = userProgress?.completed || false;
        return convertToLessonData(lesson, userProgress);
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtiene una lección específica por ID
   */
  async getLessonById(lessonId: string, userId?: string): Promise<LessonData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return null;
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return null;
      }

      // Si hay un userId, obtener el progreso del usuario
      let userProgress = null;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        userProgress = await Progress.findOne({
          user: new mongoose.Types.ObjectId(userId),
          lesson: lessonId
        });
        if (!userProgress) {
          // Crear progreso si no existe
          userProgress = new Progress({
            user: new mongoose.Types.ObjectId(userId),
            lesson: lessonId,
            course: lesson.course,
            completed: false
          });
          await userProgress.save();
        }
      }

      return convertToLessonData(lesson, userProgress);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Crea una nueva lección para un curso
   */
  async createLesson(
    courseId: string, 
    lessonData: Omit<LessonData, '_id' | 'course' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'isLocked'>
  ): Promise<LessonData> {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        throw new Error('ID de curso inválido');
      }

      // Determinar el orden más alto actual y asignar el siguiente
      const highestOrderLesson = await Lesson.findOne({ course: courseId })
        .sort({ order: -1 })
        .limit(1);
      
      const newOrder = highestOrderLesson ? highestOrderLesson.order + 1 : 0;

      // Crear la nueva lección
      const newLesson = new Lesson({
        ...lessonData,
        course: courseId,
        order: lessonData.order !== undefined ? lessonData.order : newOrder
      });

      const savedLesson = await newLesson.save();
      return convertToLessonData(savedLesson);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza una lección existente
   */
  async updateLesson(
    lessonId: string,
    lessonData: Partial<Omit<LessonData, '_id' | 'course' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'isLocked'>>
  ): Promise<LessonData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return null;
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return null;
      }

      // Actualizar los campos proporcionados
      Object.keys(lessonData).forEach(key => {
        // @ts-ignore - La operación es segura aunque TypeScript no lo reconozca
        lesson[key] = lessonData[key];
      });

      const updatedLesson = await lesson.save();
      return convertToLessonData(updatedLesson);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina una lección
   */
  async deleteLesson(lessonId: string): Promise<boolean> {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return false;
      }

      // Eliminar la lección
      const result = await Lesson.deleteOne({ _id: lessonId });
      
      // Eliminar registros de progreso asociados
      await Progress.deleteMany({ lesson: lessonId });

      return result.deletedCount === 1;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca una lección como completada para un usuario
   */
  async markLessonAsCompleted(lessonId: string, userId: string): Promise<LessonData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return null;
      }

      // Obtener la lección para verificar que existe y obtener el courseId
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return null;
      }

      // Actualizar o crear registro de progreso
      let progress = await Progress.findOne({ user: userId, lesson: lessonId });
      
      if (!progress) {
        progress = new Progress({
          user: new mongoose.Types.ObjectId(userId),
          lesson: lessonId,
          course: lesson.course,
          completed: false,
          quizCompleted: false,
          codeExercisesCompleted: false
        });
      }

      // Si la lección no tiene quiz ni ejercicios de código, marcar como completada directamente
      const hasQuiz = lesson.quizQuestions && lesson.quizQuestions.length > 0;
      const hasCodeExercises = lesson.codeExercises && lesson.codeExercises.length > 0;
      
      if (!hasQuiz && !hasCodeExercises) {
        // Lección de solo contenido
        progress.completed = true;
        progress.completedAt = new Date();
      }
      // Si tiene quiz o ejercicios, el middleware se encargará de calcular el completed

      await progress.save();
      // Devolver la lección actualizada con estado de completado
      return convertToLessonData(lesson, progress);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Marca el quiz de una lección como completado
   */
  async markQuizCompleted(lessonId: string, userId: string, score: number): Promise<LessonData | null> {
    try {
      console.log('🎯 markQuizCompleted called with:', { lessonId, userId, score });
      
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        console.log('❌ Invalid lessonId:', lessonId);
        return null;
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        console.log('❌ Lesson not found:', lessonId);
        return null;
      }

      console.log('✅ Lesson found:', lesson.title);

      let progress = await Progress.findOne({ user: userId, lesson: lessonId });
      
      if (!progress) {
        console.log('📝 Creating new progress record');
        progress = new Progress({
          user: new mongoose.Types.ObjectId(userId),
          lesson: lessonId,
          course: lesson.course,
          completed: false,
          quizCompleted: false,
          codeExercisesCompleted: false
        });
      } else {
        console.log('📝 Found existing progress:', {
          quizCompleted: progress.quizCompleted,
          codeExercisesCompleted: progress.codeExercisesCompleted,
          completed: progress.completed
        });
      }

      console.log('🎯 Marking quiz as completed with score:', score);
      progress.quizCompleted = true;
      progress.quizCompletedAt = new Date();
      progress.quizScore = score;

      console.log('💾 Saving progress...');
      await progress.save(); // El middleware calculará si debe marcar completed = true
      
      console.log('✅ Progress saved. Final state:', {
        quizCompleted: progress.quizCompleted,
        codeExercisesCompleted: progress.codeExercisesCompleted,
        completed: progress.completed
      });

      const result = convertToLessonData(lesson, progress);
      console.log('📤 Returning lesson data with completion status:', {
        isCompleted: result.isCompleted,
        quizCompleted: result.quizCompleted,
        codeExercisesCompleted: result.codeExercisesCompleted
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error in markQuizCompleted:', error);
      throw error;
    }
  }

  /**
   * Marca un ejercicio de código como completado
   */
  async markCodeExerciseCompleted(lessonId: string, exerciseId: string, userId: string): Promise<LessonData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return null;
      }

      const lesson = await Lesson.findById(lessonId);
      if (!lesson) {
        return null;
      }

      let progress = await Progress.findOne({ user: userId, lesson: lessonId });
      
      if (!progress) {
        progress = new Progress({
          user: new mongoose.Types.ObjectId(userId),
          lesson: lessonId,
          course: lesson.course,
          completed: false,
          quizCompleted: false,
          codeExercisesCompleted: false,
          completedCodeExercises: []
        });
      }

      // Agregar ejercicio a la lista de completados si no está ya
      if (!progress.completedCodeExercises) {
        progress.completedCodeExercises = [];
      }
      if (!progress.completedCodeExercises.includes(exerciseId)) {
        progress.completedCodeExercises.push(exerciseId);
      }

      // Verificar si todos los ejercicios de código están completados
      const totalCodeExercises = lesson.codeExercises ? lesson.codeExercises.length : 0;
      const completedCount = progress.completedCodeExercises.length;
      
      if (completedCount >= totalCodeExercises && totalCodeExercises > 0) {
        progress.codeExercisesCompleted = true;
        progress.codeExercisesCompletedAt = new Date();
      }

      await progress.save(); // El middleware calculará si debe marcar completed = true

      return convertToLessonData(lesson, progress);
    } catch (error) {
      throw error;
    }
  }
}

// Exportar una instancia del servicio
export const lessonService = new LessonService(); 
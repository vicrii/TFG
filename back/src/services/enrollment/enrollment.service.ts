import mongoose from 'mongoose';
import { Enrollment } from '../../../models/Enrollment';
import { Course } from '../../../models/Course';
import { Lesson } from '../../../models/Lesson';
import { LessonProgress } from '../../../models/LessonProgress';
import { ICourseData } from '../course/course.service';
import { User } from '../../../models/User';

// Interfaz para los datos de la inscripción
export interface IEnrollmentData {
  _id: string;
  user: string;
  course: ICourseData | string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  progress?: number;
}

// Helper para convertir el documento de Mongoose a IEnrollmentData
const convertToIEnrollmentData = (doc: any): IEnrollmentData => {
  if (!doc) return null as unknown as IEnrollmentData;
  
  return {
    _id: doc._id.toString(),
    user: doc.user.toString(),
    course: doc.course,
    enrolledAt: doc.enrolledAt.toISOString(),
    status: doc.status,
    progress: doc.progress
  };
};

export class EnrollmentService {
  /**
   * Calcular progreso para una inscripción específica
   */
  private async calculateCourseProgress(userId: mongoose.Types.ObjectId, courseId: string): Promise<number> {
    try {
      // Obtener total de lecciones del curso
      const totalLessons = await Lesson.countDocuments({ course: courseId });
      
      if (totalLessons === 0) {
        return 0;
      }
      
      // Obtener lecciones completadas por el usuario usando ObjectId
      const completedLessons = await LessonProgress.countDocuments({
        user: userId,
        course: courseId,
        completed: true
      });
      
      // Calcular porcentaje
      const progress = Math.round((completedLessons / totalLessons) * 100);
      
      console.log(`Progress calculated for course ${courseId}: ${completedLessons}/${totalLessons} = ${progress}%`);
      
      return progress;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  }

  /**
   * Get all cursos en los que un usuario está inscrito
   */
  async getEnrolledCourses(walletAddress: string): Promise<IEnrollmentData[]> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) throw new Error('User not found');
      
      const enrollments = await Enrollment.find({ user: user._id })
        .populate('course')
        .exec();
      
      // Calcular progreso para cada inscripción
      const enrollmentsWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const courseId = (enrollment.course as any)._id.toString();
          const progress = await this.calculateCourseProgress(user._id as mongoose.Types.ObjectId, courseId);
          
          const enrollmentData = convertToIEnrollmentData(enrollment);
          enrollmentData.progress = progress;
          
          return enrollmentData;
        })
      );
      
      return enrollmentsWithProgress;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get enrollments without progress 
   */
  async getBasicEnrollments(walletAddress: string): Promise<IEnrollmentData[]> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) throw new Error('User not found');
      const enrollments = await Enrollment.find({ user: user._id })
        .populate('course')
        .exec();
      return enrollments.map(convertToIEnrollmentData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Enroll in a course
   */
  async enrollInCourse(walletAddress: string, courseId: string): Promise<IEnrollmentData> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) throw new Error('User not found');
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }
      const existingEnrollment = await Enrollment.findOne({
        user: user._id,
        course: courseId
      });
      if (existingEnrollment) {
        throw new Error('Already enrolled in this course');
      }
      const newEnrollment = new Enrollment({
        user: user._id,
        course: courseId,
        enrolledAt: new Date(),
        status: 'active',
        progress: 0
      });
      const savedEnrollment = await newEnrollment.save();
      await savedEnrollment.populate('course');
      return convertToIEnrollmentData(savedEnrollment);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel enrollment in a course
   */
  async unenrollFromCourse(walletAddress: string, courseId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) throw new Error('User not found');
      const result = await Enrollment.deleteOne({
        user: user._id,
        course: courseId
      });
      return result.deletedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a user is enrolled in a course
   */
  async checkEnrollmentStatus(walletAddress: string, courseId: string): Promise<boolean> {
    try {
      const user = await User.findOne({ walletAddress });
      if (!user) throw new Error('User not found');
      const enrollment = await Enrollment.findOne({
        user: user._id,
        course: courseId
      });
      return !!enrollment;
    } catch (error) {
      throw error;
    }
  }
}

// Exportar una instancia del servicio
export const enrollmentService = new EnrollmentService(); 
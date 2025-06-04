import { Request, Response } from 'express';
import { enrollmentService, IEnrollmentData } from '../services/enrollment/enrollment.service';

export class EnrollmentController {
  /**
   * Obtener todos los cursos en los que un usuario está inscrito
   */
  async getEnrolledCourses(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const enrollments = await enrollmentService.getEnrolledCourses(walletAddress);
      res.json(enrollments);
    } catch (error) {
      console.error('Error in getEnrolledCourses controller:', error);
      res.status(500).json({ 
        message: 'Error fetching enrolled courses',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener inscripciones básicas (sin cálculo de progreso)
   */
  async getBasicEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      const enrollments = await enrollmentService.getBasicEnrollments(walletAddress);
      res.json(enrollments);
    } catch (error) {
      console.error('Error in getBasicEnrollments controller:', error);
      res.status(500).json({ 
        message: 'Error fetching basic enrollments',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Inscribirse en un curso
   */
  async enrollInCourse(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const { courseId } = req.params;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      if (!courseId) {
        res.status(400).json({ message: 'Course ID is required' });
        return;
      }
      
      const enrollment = await enrollmentService.enrollInCourse(walletAddress, courseId);
      
      res.status(201).json({
        message: 'Successfully enrolled in course',
        enrollment
      });
    } catch (error) {
      console.error('Error in enrollInCourse controller:', error);
      
      // manejar errores específicos
      if (error instanceof Error) {
        if (error.message.includes('Already enrolled')) {
          res.status(409).json({ message: error.message });
          return;
        }
        if (error.message.includes('Course not found')) {
          res.status(404).json({ message: error.message });
          return;
        }
      }
      
      res.status(500).json({ 
        message: 'Error enrolling in course',
        error: (error as Error).message 
      });
    }
  }

  /**
   * cancelar inscripción en un curso
   */
  async unenrollFromCourse(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const { courseId } = req.params;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      if (!courseId) {
        res.status(400).json({ message: 'Course ID is required' });
        return;
      }
      
      const success = await enrollmentService.unenrollFromCourse(walletAddress, courseId);
      
      if (success) {
        res.json({ message: 'Successfully unenrolled from course' });
      } else {
        res.status(404).json({ message: 'Enrollment not found' });
      }
    } catch (error) {
      console.error('Error in unenrollFromCourse controller:', error);
      res.status(500).json({ 
        message: 'Error unenrolling from course',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Comprobar si un usuario está inscrito en un curso
   */
  async checkEnrollmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const { courseId } = req.params;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      if (!courseId) {
        res.status(400).json({ message: 'Course ID is required' });
        return;
      }
      
      const isEnrolled = await enrollmentService.checkEnrollmentStatus(walletAddress, courseId);
      
      res.json({ isEnrolled });
    } catch (error) {
      console.error('Error in checkEnrollmentStatus controller:', error);
      res.status(500).json({ 
        message: 'Error checking enrollment status',
        error: (error as Error).message 
      });
    }
  }
}

export const enrollmentController = new EnrollmentController(); 
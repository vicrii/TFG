import { Router } from 'express';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authenticateUser } from '../../db/server/middleware/auth';

const router = Router();

// All enrollment routes require authentication
router.get('/enrollments', authenticateUser, enrollmentController.getEnrolledCourses);
router.get('/enrollments/basic', authenticateUser, enrollmentController.getBasicEnrollments);
router.post('/enrollments/:courseId', authenticateUser, enrollmentController.enrollInCourse);
router.delete('/enrollments/:courseId', authenticateUser, enrollmentController.unenrollFromCourse);
router.get('/enrollments/check/:courseId', authenticateUser, enrollmentController.checkEnrollmentStatus);

export default router; 
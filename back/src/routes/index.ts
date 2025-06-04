import express from 'express';
import courseRoutes from './course.routes';
import lessonRoutes from './lesson.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import enrollmentRoutes from './enrollment.routes';
import chatRoutes from './chat.routes';
import publicCoursesRoutes from './publicCourses.routes';
import analyticsRoutes from './analytics.routes';

const router = express.Router();

// Registrar todas las rutas
router.use('/api', courseRoutes);
router.use('/api', lessonRoutes);
router.use('/api', authRoutes);
router.use('/api', userRoutes);
router.use('/api', enrollmentRoutes);
router.use('/api', chatRoutes);
router.use('/api/public/courses', publicCoursesRoutes);
router.use('/api/analytics', analyticsRoutes);

export default router; 
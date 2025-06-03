import { Router } from 'express';
import courseRoutes from './course.routes';
import lessonRoutes from './lesson.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import enrollmentRoutes from './enrollment.routes';
// import transcriptionRoutes from './transcription.routes'; // COMMENTED: YouTube transcription disabled to avoid dependency issues
import lessonContentGeneratorRoutes from './lessonContentGenerator.routes';
import textGeneratorRoutes from './textGenerator.routes';
import chatRoutes from './chat.routes';
import publicCoursesRoutes from './publicCourses.routes';
import analyticsRoutes from './analytics.routes';
// Importar aquí otras rutas a medida que las vayamos creando

const router = Router();

// Prefijo API para todas las rutas
router.use('/api', courseRoutes);
router.use('/api', lessonRoutes);
router.use('/api', authRoutes);
router.use('/api', userRoutes);
router.use('/api', enrollmentRoutes);
// router.use('/api', transcriptionRoutes); // COMMENTED: YouTube transcription disabled to avoid dependency issues
router.use('/api', lessonContentGeneratorRoutes);
router.use('/api', textGeneratorRoutes);
router.use('/api', chatRoutes);
router.use('/api', publicCoursesRoutes);
router.use('/api/analytics', analyticsRoutes);
// Agregar aquí otras rutas con sus prefijos correspondientes

export default router; 
import { Router } from 'express';
import publicCoursesRoutes from './publicCourses.routes';

const router = Router();

// Rutas públicas
router.use('/public/courses', publicCoursesRoutes);

export default router; 
import { Router } from 'express';
import { courseController } from '../controllers/course.controller';

const router = Router();

// Rutas públicas (sin autenticación)
router.get('/public/courses', courseController.getPublicCourses);
router.get('/public/courses/:id', courseController.getPublicCourseById);

// Rutas autenticadas
router.get('/courses', courseController.getPublishedCourses);
router.get('/courses/:id', courseController.getCourseById);
router.post('/courses', courseController.createCourse);
router.put('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);
router.patch('/courses/:id/publish', courseController.toggleCoursePublishStatus);

// Rutas para moderadores
// Estas rutas podrían tener middleware adicional para verificar roles
router.get('/admin/courses', courseController.getAllCoursesForModerator);

export default router; 
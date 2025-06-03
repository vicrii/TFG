import { Router } from 'express';
import { lessonController } from '../controllers/lesson.controller';
import { authenticateUser } from '../../db/server/middleware/auth';

const router = Router();

// Rutas autenticadas
// Obtener lecciones de un curso
router.get('/lessons/by-course/:courseId', authenticateUser, lessonController.getCourseLessons);

// Obtener, actualizar y eliminar una lección específica
router.get('/lessons/:id', authenticateUser, lessonController.getLessonById);
router.put('/lessons/:id', authenticateUser, lessonController.updateLesson);
router.delete('/lessons/:id', authenticateUser, lessonController.deleteLesson);

// Crear una nueva lección para un curso
router.post('/lessons/by-course/:courseId', authenticateUser, lessonController.createLesson);

// Marcar una lección como completada (para lecciones de solo contenido)
router.post('/lessons/:id/complete', authenticateUser, lessonController.markLessonAsCompleted);

// NUEVAS RUTAS para completado separado
// Marcar quiz como completado
router.post('/lessons/:id/complete-quiz', authenticateUser, lessonController.markQuizCompleted);

// Marcar un ejercicio de código como completado
router.post('/lessons/:lessonId/complete-exercise/:exerciseId', authenticateUser, lessonController.markCodeExerciseCompleted);

export default router; 
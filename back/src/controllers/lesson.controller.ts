import { Request, Response } from 'express';
import { lessonService, LessonData } from '../services/lesson/lesson.service';
import { User } from '../../models/User';

export class LessonController {
  /**
   * Obtiene todas las lecciones de un curso
   */
  async getCourseLessons(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      // Buscar el usuario por wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      const userId = (user._id as string).toString();

      const lessons = await lessonService.getCourseLessons(courseId, userId);
      res.json(lessons);
    } catch (error) {
      console.error('Error in getCourseLessons controller:', error);
      res.status(500).json({ 
        message: 'Error al obtener lecciones del curso',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtiene una lección específica por ID
   */
  async getLessonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      // Buscar el usuario por wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      const userId = (user._id as string).toString();

      const lesson = await lessonService.getLessonById(id, userId);

      if (!lesson) {
        res.status(404).json({ message: 'Lección no encontrada' });
        return;
      }

      res.json(lesson);
    } catch (error) {
      console.error('Error in getLessonById controller:', error);
      res.status(500).json({
        message: 'Error al obtener la lección',
        error: (error as Error).message
      });
    }
  }

  /**
   * Crea una nueva lección
   */
  async createLesson(req: Request, res: Response): Promise<void> {
    try {
      const { courseId } = req.params;
      const lessonData = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      // Aquí se podría verificar si el usuario tiene permisos para crear lecciones
      
      const newLesson = await lessonService.createLesson(courseId, lessonData);
      res.status(201).json(newLesson);
    } catch (error) {
      console.error('Error in createLesson controller:', error);
      res.status(500).json({ 
        message: 'Error al crear la lección',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualiza una lección existente
   */
  async updateLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const lessonData = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      // Aquí se podría verificar si el usuario tiene permisos para actualizar lecciones
      
      const updatedLesson = await lessonService.updateLesson(id, lessonData);
      
      if (!updatedLesson) {
        res.status(404).json({ message: 'Lección no encontrada' });
        return;
      }
      
      res.json(updatedLesson);
    } catch (error) {
      console.error('Error in updateLesson controller:', error);
      res.status(500).json({ 
        message: 'Error al actualizar la lección',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Elimina una lección
   */
  async deleteLesson(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      // Aquí se podría verificar si el usuario tiene permisos para eliminar lecciones
      
      const success = await lessonService.deleteLesson(id);
      
      if (!success) {
        res.status(404).json({ message: 'Lección no encontrada' });
        return;
      }
      
      res.status(200).json({ message: 'Lección eliminada exitosamente' });
    } catch (error) {
      console.error('Error in deleteLesson controller:', error);
      res.status(500).json({ 
        message: 'Error al eliminar la lección',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Marca una lección como completada
   */
  async markLessonAsCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }

      // Buscar el usuario por wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      const userId = (user._id as string).toString();

      const updatedLesson = await lessonService.markLessonAsCompleted(id, userId);

      if (!updatedLesson) {
        res.status(404).json({ message: 'Lección no encontrada' });
        return;
      }

      res.json(updatedLesson);
    } catch (error) {
      console.error('Error in markLessonAsCompleted controller:', error);
      res.status(500).json({
        message: 'Error al marcar la lección como completada',
        error: (error as Error).message
      });
    }
  }

  /**
   * Marca un ejercicio de código como completado
   */
  async markCodeExerciseCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { lessonId, exerciseId } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }

      // Buscar el usuario por wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      const userId = (user._id as string).toString();

      const updatedLesson = await lessonService.markCodeExerciseCompleted(lessonId, exerciseId, userId);

      if (!updatedLesson) {
        res.status(404).json({ message: 'Lección o ejercicio no encontrado' });
        return;
      }

      res.json(updatedLesson);
    } catch (error) {
      console.error('Error in markCodeExerciseCompleted controller:', error);
      res.status(500).json({
        message: 'Error al marcar el ejercicio como completado',
        error: (error as Error).message
      });
    }
  }

  /**
   * Marca el quiz de una lección como completado
   */
  async markQuizCompleted(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { score } = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;

      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }

      if (typeof score !== 'number' || score < 0 || score > 100) {
        res.status(400).json({ message: 'Score debe ser un número entre 0 y 100' });
        return;
      }

      // Buscar el usuario por wallet address
      const user = await User.findOne({ walletAddress });
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      const userId = (user._id as string).toString();

      const updatedLesson = await lessonService.markQuizCompleted(id, userId, score);

      if (!updatedLesson) {
        res.status(404).json({ message: 'Lección no encontrada' });
        return;
      }

      res.json(updatedLesson);
    } catch (error) {
      console.error('Error in markQuizCompleted controller:', error);
      res.status(500).json({
        message: 'Error al marcar el quiz como completado',
        error: (error as Error).message
      });
    }
  }
}

export const lessonController = new LessonController(); 
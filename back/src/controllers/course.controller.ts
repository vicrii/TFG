import { Request, Response } from 'express';
import { courseService, ICourseData } from '../services/course/course.service';

export class CourseController {
  /**
   * Obtiene cursos públicos
   */
  async getPublicCourses(req: Request, res: Response): Promise<void> {
    try {
      const { sortBy, sortOrder, instructor } = req.query;
      
      const courses = await courseService.getPublicCourses({
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        instructor: instructor as string
      });
      
      res.json(courses);
    } catch (error) {
      console.error('Error in getPublicCourses controller:', error);
      res.status(500).json({ 
        message: 'Error al obtener cursos públicos',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtiene un curso público por ID
   */
  async getPublicCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.getPublicCourseById(id);
      
      if (!course) {
        res.status(404).json({ message: 'Curso no encontrado' });
        return;
      }
      
      res.json(course);
    } catch (error) {
      console.error('Error in getPublicCourseById controller:', error);
      res.status(500).json({ 
        message: 'Error al obtener el curso',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtiene cursos publicados (autenticado)
   */
  async getPublishedCourses(req: Request, res: Response): Promise<void> {
    try {
      const { sortBy, sortOrder, instructor } = req.query;
      
      const courses = await courseService.getPublishedCourses({
        sortBy: sortBy as string,
        sortOrder: sortOrder as string,
        instructor: instructor as string
      });
      
      res.json(courses);
    } catch (error) {
      console.error('Error in getPublishedCourses controller:', error);
      res.status(500).json({ 
        message: 'Error al obtener cursos publicados',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtiene todos los cursos (para moderadores)
   */
  async getAllCoursesForModerator(req: Request, res: Response): Promise<void> {
    try {
      // Aquí se podría verificar si el usuario es moderador
      
      const courses = await courseService.getAllCoursesForModerator();
      res.json(courses);
    } catch (error) {
      console.error('Error in getAllCoursesForModerator controller:', error);
      res.status(500).json({ 
        message: 'Error al obtener todos los cursos',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtiene un curso por ID (autenticado)
   */
  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const course = await courseService.getCourseById(id);
      
      if (!course) {
        res.status(404).json({ message: 'Curso no encontrado' });
        return;
      }
      
      res.json(course);
    } catch (error) {
      console.error('Error in getCourseById controller:', error);
      res.status(500).json({ 
        message: 'Error al obtener el curso',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Cambia el estado de publicación de un curso
   */
  async toggleCoursePublishStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      const result = await courseService.toggleCoursePublishStatus(id, walletAddress);
      res.json(result);
    } catch (error) {
      console.error('Error in toggleCoursePublishStatus controller:', error);
      res.status(500).json({ 
        message: 'Error al cambiar estado de publicación',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Elimina un curso
   */
  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      const result = await courseService.deleteCourse(id, walletAddress);
      res.json(result);
    } catch (error) {
      console.error('Error in deleteCourse controller:', error);
      res.status(500).json({ 
        message: 'Error al eliminar el curso',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Crea un nuevo curso
   */
  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseData = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      const newCourse = await courseService.createCourse(courseData, walletAddress);
      res.status(201).json(newCourse);
    } catch (error) {
      console.error('Error in createCourse controller:', error);
      res.status(500).json({ 
        message: 'Error al crear el curso',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualiza un curso existente
   */
  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const courseData = req.body;
      const walletAddress = req.headers['x-wallet-address'] as string;
      
      if (!walletAddress) {
        res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
        return;
      }
      
      const updatedCourse = await courseService.updateCourse(id, courseData, walletAddress);
      res.json(updatedCourse);
    } catch (error) {
      console.error('Error in updateCourse controller:', error);
      res.status(500).json({ 
        message: 'Error al actualizar el curso',
        error: (error as Error).message 
      });
    }
  }
}

export const courseController = new CourseController(); 
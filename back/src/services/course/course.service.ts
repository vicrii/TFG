import mongoose from 'mongoose';
import { Course, ICourse } from '../../../models/Course'; // Import both Course model and its interface

// Interfaces
interface Instructor {
  walletAddress: string;
  displayName: string;
}

export interface ICourseData {
  _id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  instructor: string | Instructor;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
}

// Opciones para búsqueda y filtrado
interface FetchParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
  instructor?: string;
}

// Helper to convert Mongoose document to ICourseData
const convertToICourseData = (doc: any): ICourseData => {
  if (!doc) return null as unknown as ICourseData;
  
  return {
    _id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    content: doc.content,
    imageUrl: doc.imageUrl,
    instructor: doc.instructor,
    price: doc.price,
    level: doc.level,
    tags: doc.tags,
    published: doc.published,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

export class CourseService {
  /**
   * Obtiene cursos públicos con opciones de filtrado y ordenación
   */
  async getPublicCourses(params?: FetchParams): Promise<ICourseData[]> {
    try {
      const query: any = { published: true };
      
      // Aplicar filtro por instructor si se proporciona
      if (params?.instructor) {
        query.instructor = params.instructor;
      }
      
      let queryBuilder = Course.find(query);
      
      // Aplicar ordenación si se proporciona
      if (params?.sortBy) {
        const sortDirection = params?.sortOrder === 'desc' ? -1 : 1;
        const sortOptions: any = {};
        sortOptions[params.sortBy] = sortDirection;
        queryBuilder = queryBuilder.sort(sortOptions);
      }
      
      const courses = await queryBuilder.exec();
      return courses.map(convertToICourseData);
    } catch (error) {
      console.error('Error fetching public courses:', error);
      throw error;
    }
  }

  /**
   * Obtiene un curso público por su ID
   */
  async getPublicCourseById(courseId: string): Promise<ICourseData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return null;
      }
      
      const course = await Course.findOne({ _id: courseId, published: true });
      return course ? convertToICourseData(course) : null;
    } catch (error) {
      console.error('Error fetching public course by ID:', error);
      throw error;
    }
  }

  /**
   * Obtiene cursos publicados con opciones de filtrado y ordenación (autenticado)
   */
  async getPublishedCourses(params?: FetchParams): Promise<ICourseData[]> {
    try {
      const query: any = { published: true };
      
      if (params?.instructor) {
        query.instructor = params.instructor;
      }
      
      let queryBuilder = Course.find(query);
      
      if (params?.sortBy) {
        const sortDirection = params?.sortOrder === 'desc' ? -1 : 1;
        const sortOptions: any = {};
        sortOptions[params.sortBy] = sortDirection;
        queryBuilder = queryBuilder.sort(sortOptions);
      }
      
      const courses = await queryBuilder.exec();
      return courses.map(convertToICourseData);
    } catch (error) {
      console.error('Error fetching published courses:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los cursos (para moderadores)
   */
  async getAllCoursesForModerator(): Promise<ICourseData[]> {
    try {
      const courses = await Course.find();
      return courses.map(convertToICourseData);
    } catch (error) {
      console.error('Error fetching all courses for moderator:', error);
      throw error;
    }
  }

  /**
   * Obtiene un curso por su ID (autenticado)
   */
  async getCourseById(courseId: string): Promise<ICourseData | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return null;
      }
      
      const course = await Course.findById(courseId);
      return course ? convertToICourseData(course) : null;
    } catch (error) {
      console.error('Error fetching course by ID:', error);
      throw error;
    }
  }

  /**
   * Cambia el estado de publicación de un curso
   */
  async toggleCoursePublishStatus(courseId: string, walletAddress: string): Promise<{ published: boolean, message: string }> {
    try {
      // Verificar si el usuario está autorizado (moderador o instructor del curso)
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Curso no encontrado');
      }
      
      // Comprobar si es el instructor o si es moderador
      // Esto requeriría verificación adicional de roles en un entorno real
      
      // Cambiar el estado de publicación
      course.published = !course.published;
      await course.save();
      
      return {
        published: course.published,
        message: course.published ? 'Curso publicado exitosamente' : 'Curso despublicado exitosamente'
      };
    } catch (error) {
      console.error('Error toggling course publish status:', error);
      throw error;
    }
  }

  /**
   * Elimina un curso
   */
  async deleteCourse(courseId: string, walletAddress: string): Promise<{ message: string }> {
    try {
      // Verificar autorización
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Curso no encontrado');
      }
      
      // Comprobar si es el instructor o si es moderador
      // Esto requeriría verificación adicional de roles en un entorno real
      
      // Eliminar el curso
      await Course.deleteOne({ _id: courseId });
      
      return {
        message: 'Curso eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo curso
   */
  async createCourse(
    courseData: Omit<ICourseData, '_id' | 'createdAt' | 'published' | 'instructor'>,
    walletAddress: string
  ): Promise<ICourseData> {
    try {
      // Crear el curso con el instructor asignado
      const newCourse = new Course({
        ...courseData,
        instructor: walletAddress,
        published: true, // Ahora se publica automáticamente
        createdAt: new Date()
      });
      
      const savedCourse = await newCourse.save();
      return convertToICourseData(savedCourse);
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Actualiza un curso existente
   */
  async updateCourse(
    courseId: string,
    courseData: Partial<Omit<ICourseData, '_id' | 'createdAt' | 'published' | 'instructor'>>,
    walletAddress: string
  ): Promise<ICourseData> {
    try {
      // Verificar autorización
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new Error('Curso no encontrado');
      }
      
      // Comprobar si es el instructor o si es moderador
      // Esto requeriría verificación adicional de roles en un entorno real
      
      // Actualizar el curso
      Object.assign(course, courseData);
      course.updatedAt = new Date();
      
      const updatedCourse = await course.save();
      return convertToICourseData(updatedCourse);
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }
}

// Exportar una instancia del servicio
export const courseService = new CourseService(); 
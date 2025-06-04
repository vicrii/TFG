import { apiClient } from '../api/api.client';

// Interfaces
export interface QuizQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface CodeExercise {
  id?: string;
  title: string;
  description: string;
  language: string;
  initialCode: string;
  solution: string;
  hint?: string;
  expectedOutput?: string;
  isCompleted?: boolean;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  content: string;
  course: string; // Course ID
  order: number;
  videoUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  quizQuestions?: QuizQuestion[];
  codeExercises?: CodeExercise[]; // Añadido ejercicios de código
  isCompleted?: boolean;
  isLocked?: boolean;
  requiredToProgress?: boolean;
  minQuizScore?: number; // Porcentaje mínimo para aprobar el quiz (0-100)
  // NUEVOS CAMPOS para tracking separado
  quizCompleted?: boolean;
  quizScore?: number;
  codeExercisesCompleted?: boolean;
  completedCodeExercises?: string[];
}

// API para lecciones
export const lessonApi = {
  /**
   * Obtiene todas las lecciones de un curso
   */
  async getCourseLessons(courseId: string, walletAddress?: string): Promise<Lesson[]> {
    try {
      // Si hay autenticación, usar endpoint con progreso; si no, usar endpoint público
      if (walletAddress) {
        const options = apiClient.setAuthHeader(walletAddress);
        const response = await apiClient.get<Lesson[]>(`/lessons/by-course/${courseId}`, options);
        return response;
      } else {
        // Para usuarios no autenticados, usar endpoint público
        const response = await apiClient.get<Lesson[]>(`/public/courses/${courseId}/lesson-previews`);
        return response;
      }
    } catch (error) {
      console.error(`Error fetching lessons for course ${courseId}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene una lección específica
   */
  async getLessonById(lessonId: string, walletAddress?: string): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      
      // Make the API call
      const response = await apiClient.get<Lesson>(`/lessons/${lessonId}`, options);
      
      // Verify and fix the response if needed
      if (!response) {
        console.error('API returned null or undefined response');
        throw new Error('No se pudo obtener la lección: Respuesta vacía del servidor');
      }
      
      // Check if content exists and is valid
      if (response.content === undefined || response.content === null) {
        console.warn('Lesson content is undefined or null, setting to empty string');
        response.content = '';
      }
      
      // Ensure content is a string
      if (typeof response.content !== 'string') {
        console.warn(`Lesson content is not a string, it's a ${typeof response.content}. Converting to string.`);
        try {
          response.content = JSON.stringify(response.content);
        } catch (e) {
          console.error('Failed to stringify non-string content:', e);
          response.content = '';
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Error fetching lesson ${lessonId}:`, error);
      throw error;
    }
  },

  /**
   * Crea una nueva lección
   */
  async createLesson(
    courseId: string, 
    lessonData: Omit<Lesson, '_id' | 'course' | 'createdAt' | 'updatedAt' | 'isCompleted' | 'isLocked'>,
    walletAddress: string
  ): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.post<Lesson>(`/lessons/by-course/${courseId}`, lessonData, options);
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  },

  /**
   * Actualiza una lección
   */
  async updateLesson(
    lessonId: string, 
    lessonData: Partial<Lesson>,
    walletAddress: string
  ): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.put<Lesson>(`/lessons/${lessonId}`, lessonData, options);
    } catch (error) {
      console.error(`Error updating lesson ${lessonId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina una lección
   */
  async deleteLesson(lessonId: string, walletAddress: string): Promise<void> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      await apiClient.delete(`/lessons/${lessonId}`, options);
    } catch (error) {
      console.error(`Error deleting lesson ${lessonId}:`, error);
      throw error;
    }
  },

  /**
   * Marca una lección como completada
   */
  async markLessonAsCompleted(lessonId: string, walletAddress: string): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.post<Lesson>(`/lessons/${lessonId}/complete`, {}, options);
    } catch (error) {
      console.error(`Error marking lesson ${lessonId} as completed:`, error);
      throw error;
    }
  },

  /**
   * Marca el quiz de una lección como completado
   */
  async markQuizCompleted(lessonId: string, score: number, walletAddress: string): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.post<Lesson>(`/lessons/${lessonId}/complete-quiz`, { score }, options);
    } catch (error) {
      console.error(`Error marking quiz as completed for lesson ${lessonId}:`, error);
      throw error;
    }
  },

  /**
   * Marca un ejercicio de código como completado
   */
  async markCodeExerciseCompleted(lessonId: string, exerciseId: string, walletAddress: string): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.post<Lesson>(
        `/lessons/${lessonId}/complete-exercise/${exerciseId}`, 
        {}, 
        options
      );
    } catch (error) {
      console.error(`Error marking code exercise as completed (Lesson=${lessonId}, Exercise=${exerciseId}):`, error);
      throw error;
    }
  },

  /**
   * Marca una lección como vista
   */
  async markLessonAsViewed(lessonId: string, walletAddress?: string): Promise<Lesson> {
    try {
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.post<Lesson>(`/lessons/${lessonId}/complete`, {}, options);
    } catch (error) {
      console.error(`Error marking lesson ${lessonId} as viewed:`, error);
      throw error;
    }
  }
};

// Exportar el servicio de lecciones con el método setWalletAddress añadido
export const lessonService = {
  ...lessonApi,
  
  setWalletAddress(walletAddress: string) {
    // Utilizar el método del apiClient para establecer la cabecera de autenticación
    apiClient.setAuthHeader(walletAddress);
    console.log('Wallet address set for lesson API');
    return walletAddress;
  },
  
  clearWalletAddress(): void {
    console.log('Wallet address cleared for lessons');
    // No necesitamos hacer nada aquí
  }
}; 
import { apiClient } from '../api/api.client';
import { ICourseData } from '../course/courseService';

// Interfaces
export interface IEnrollment {
  _id: string;
  user: string;
  course: ICourseData;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  progress?: number;
}

// Cliente API para endpoints relacionados con inscripciones
export const enrollmentApi = {
  /**
   * Obtener todos los cursos en los que un usuario está inscrito
   */
  async getEnrolledCourses(): Promise<IEnrollment[]> {
    try {
      // Primer intento: probar endpoint completo de inscripciones
      try {
        // console.log('[enrollmentApi] Intentando obtener inscripciones completas');
        const response = await apiClient.get<IEnrollment[]>('/enrollments');
        
        // Cachear respuestas exitosas para uso offline
        if (response && Array.isArray(response)) {
          // console.log(`[enrollmentApi] Cacheando ${response.length} inscripciones`);
          localStorage.setItem('cachedEnrollments', JSON.stringify(response));
        } else {
          console.warn('[enrollmentApi] Respuesta recibida no es un arreglo:', response);
        }
        
        return response;
      } catch (error) {
        console.error('[enrollmentApi] Error obteniendo inscripciones, probando endpoint básico:', error);
        // Segundo intento: probar endpoint básico
        // console.log('[enrollmentApi] Intentando obtener inscripciones básicas como respaldo');
        const basicResponse = await apiClient.get<IEnrollment[]>('/enrollments/basic');
        
        if (basicResponse && Array.isArray(basicResponse)) {
          // console.log(`[enrollmentApi] Cacheando ${basicResponse.length} inscripciones básicas`);
          localStorage.setItem('cachedBasicEnrollments', JSON.stringify(basicResponse));
        }
        
        return basicResponse;
      }
    } catch (error) {
      console.error('[enrollmentApi] Error obteniendo cursos inscritos:', error);
      
      // Manejar caso offline devolviendo datos cacheados si están disponibles
      const cachedEnrollments = localStorage.getItem('cachedEnrollments');
      if (cachedEnrollments) {
        try {
          // console.log('[enrollmentApi] Usando inscripciones cacheadas debido a error de conexión');
          return JSON.parse(cachedEnrollments);
        } catch (e) {
          console.error('[enrollmentApi] Error parseando inscripciones cacheadas:', e);
        }
      }
      
      throw new Error(`Error obteniendo cursos inscritos: ${(error as Error).message}`);
    }
  },

  /**
   * Obtener inscripciones básicas (sin cálculo de progreso)
   */
  async getBasicEnrollments(): Promise<IEnrollment[]> {
    try {
      // console.log('[enrollmentApi] Obteniendo inscripciones básicas');
      const response = await apiClient.get<IEnrollment[]>('/enrollments/basic');
      
      // Cachear respuestas exitosas para uso offline
      if (response && Array.isArray(response)) {
        // console.log(`[enrollmentApi] Cacheando ${response.length} inscripciones básicas`);
        localStorage.setItem('cachedBasicEnrollments', JSON.stringify(response));
        return response;
      } else {
        console.warn('[enrollmentApi] Respuesta recibida no es un arreglo:', response);
        throw new Error('Formato de respuesta inválido recibido del servidor');
      }
    } catch (error) {
      console.error('[enrollmentApi] Error obteniendo inscripciones básicas:', error);
      
      // Intentar usar datos cacheados si están disponibles
      const cachedBasicEnrollments = localStorage.getItem('cachedBasicEnrollments');
      if (cachedBasicEnrollments) {
        try {
          // console.log('[enrollmentApi] Usando inscripciones básicas cacheadas debido a error');
          return JSON.parse(cachedBasicEnrollments);
        } catch (e) {
          console.error('[enrollmentApi] Error parseando inscripciones básicas cacheadas:', e);
        }
      }
      
      // Si las inscripciones cacheadas no están disponibles, probar inscripciones regulares cacheadas
      const cachedEnrollments = localStorage.getItem('cachedEnrollments');
      if (cachedEnrollments) {
        try {
          // console.log('[enrollmentApi] Usando inscripciones regulares cacheadas como respaldo');
          return JSON.parse(cachedEnrollments);
        } catch (e) {
          console.error('[enrollmentApi] Error parseando inscripciones regulares cacheadas:', e);
        }
      }
      
      throw new Error(`Error obteniendo inscripciones básicas: ${(error as Error).message}`);
    }
  },

  /**
   * Inscribirse en un curso
   */
  async enrollInCourse(courseId: string): Promise<{ message: string, enrollment: IEnrollment }> {
    try {
      return await apiClient.post<{ message: string, enrollment: IEnrollment }>(`/enrollments/${courseId}`, {});
    } catch (error) {
      console.error('Error inscribiéndose en el curso:', error);
      throw error;
    }
  },

  /**
   * Cancelar inscripción en un curso
   */
  async unenrollFromCourse(courseId: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/enrollments/${courseId}`, {});
    } catch (error) {
      console.error('Error cancelando inscripción del curso:', error);
      throw error;
    }
  },

  /**
   * Verificar si un usuario está inscrito en un curso
   */
  async checkEnrollmentStatus(courseId: string): Promise<{ isEnrolled: boolean }> {
    try {
      return await apiClient.get<{ isEnrolled: boolean }>(`/enrollments/check/${courseId}`);
    } catch (error) {
      console.error('Error verificando estado de inscripción:', error);
      return { isEnrolled: false };
    }
  }
};

// Exportar el servicio de inscripciones con el método setWalletAddress añadido
export const enrollmentService = {
  ...enrollmentApi,
  
  setWalletAddress(walletAddress: string) {
    // Utilizar el método del apiClient para establecer la cabecera de autenticación
    apiClient.setAuthHeader(walletAddress);
    return walletAddress;
  }
}; 
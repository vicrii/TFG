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

// API client for enrollment-related endpoints
export const enrollmentApi = {
  /**
   * Get all courses a user is enrolled in
   */
  async getEnrolledCourses(): Promise<IEnrollment[]> {
    try {
      // First attempt: try full enrollments endpoint
      try {
        // console.log('[enrollmentApi] Attempting to fetch full enrollments');
        const response = await apiClient.get<IEnrollment[]>('/enrollments');
        
        // Cache successful responses for offline use
        if (response && Array.isArray(response)) {
          // console.log(`[enrollmentApi] Caching ${response.length} enrollments`);
          localStorage.setItem('cachedEnrollments', JSON.stringify(response));
        } else {
          console.warn('[enrollmentApi] Received non-array response:', response);
        }
        
        return response;
      } catch (error) {
        console.error('[enrollmentApi] Error getting enrollments, trying basic endpoint:', error);
        // Second attempt: try basic endpoint
        // console.log('[enrollmentApi] Attempting to fetch basic enrollments as fallback');
        const basicResponse = await apiClient.get<IEnrollment[]>('/enrollments/basic');
        
        if (basicResponse && Array.isArray(basicResponse)) {
          // console.log(`[enrollmentApi] Caching ${basicResponse.length} basic enrollments`);
          localStorage.setItem('cachedBasicEnrollments', JSON.stringify(basicResponse));
        }
        
        return basicResponse;
      }
    } catch (error) {
      console.error('[enrollmentApi] Error fetching enrolled courses:', error);
      
      // Handle offline case by returning cached data if available
      const cachedEnrollments = localStorage.getItem('cachedEnrollments');
      if (cachedEnrollments) {
        try {
          // console.log('[enrollmentApi] Using cached enrollments due to connection error');
          return JSON.parse(cachedEnrollments);
        } catch (e) {
          console.error('[enrollmentApi] Error parsing cached enrollments:', e);
        }
      }
      
      throw new Error(`Error fetching enrolled courses: ${(error as Error).message}`);
    }
  },

  /**
   * Get basic enrollments (without progress calculation)
   */
  async getBasicEnrollments(): Promise<IEnrollment[]> {
    try {
      // console.log('[enrollmentApi] Fetching basic enrollments');
      const response = await apiClient.get<IEnrollment[]>('/enrollments/basic');
      
      // Cache successful responses for offline use
      if (response && Array.isArray(response)) {
        // console.log(`[enrollmentApi] Caching ${response.length} basic enrollments`);
        localStorage.setItem('cachedBasicEnrollments', JSON.stringify(response));
        return response;
      } else {
        console.warn('[enrollmentApi] Received non-array response:', response);
        throw new Error('Invalid response format received from server');
      }
    } catch (error) {
      console.error('[enrollmentApi] Error fetching basic enrollments:', error);
      
      // Try to use cached data if available
      const cachedBasicEnrollments = localStorage.getItem('cachedBasicEnrollments');
      if (cachedBasicEnrollments) {
        try {
          // console.log('[enrollmentApi] Using cached basic enrollments due to error');
          return JSON.parse(cachedBasicEnrollments);
        } catch (e) {
          console.error('[enrollmentApi] Error parsing cached basic enrollments:', e);
        }
      }
      
      // If cached enrollments are not available, try regular cached enrollments
      const cachedEnrollments = localStorage.getItem('cachedEnrollments');
      if (cachedEnrollments) {
        try {
          // console.log('[enrollmentApi] Using regular cached enrollments as fallback');
          return JSON.parse(cachedEnrollments);
        } catch (e) {
          console.error('[enrollmentApi] Error parsing cached regular enrollments:', e);
        }
      }
      
      throw new Error(`Error fetching basic enrollments: ${(error as Error).message}`);
    }
  },

  /**
   * Enroll in a course
   */
  async enrollInCourse(courseId: string): Promise<{ message: string, enrollment: IEnrollment }> {
    try {
      return await apiClient.post<{ message: string, enrollment: IEnrollment }>(`/enrollments/${courseId}`, {});
    } catch (error) {
      console.error('Error enrolling in course:', error);
      throw error;
    }
  },

  /**
   * Cancel enrollment in a course
   */
  async unenrollFromCourse(courseId: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete<{ message: string }>(`/enrollments/${courseId}`, {});
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      throw error;
    }
  },

  /**
   * Check if a user is enrolled in a course
   */
  async checkEnrollmentStatus(courseId: string): Promise<{ isEnrolled: boolean }> {
    try {
      return await apiClient.get<{ isEnrolled: boolean }>(`/enrollments/check/${courseId}`);
    } catch (error) {
      console.error('Error checking enrollment status:', error);
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
import { apiClient } from '../api/api.client';

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

// Interfaces para filtrado y ordenación
interface FetchParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc' | string;
  instructor?: string;
}

// Helpers para manejo de caché
const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error saving data to cache:', error);
  }
};

const getFromCache = (key: string, maxAgeMs = 3600000) => { // 1 hora por default
  try {
    const cached = localStorage.getItem(`cache_${key}`);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    // Verificar si la caché es aún válida
    if (Date.now() - timestamp > maxAgeMs) return null;
    
    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

// API para cursos
export const courseApi = {
  /**
   * Obtiene cursos públicos
   */
  async getPublicCourses(params?: FetchParams): Promise<ICourseData[]> {
    try {
      // Clave de caché basada en parámetros
      const cacheKey = `public_courses_${JSON.stringify(params || {})}`;
      
      // Construir URL con query params
      let endpoint = '/public/courses';
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.instructor) queryParams.append('instructor', params.instructor);
        
        if (queryParams.toString()) {
          endpoint += `?${queryParams.toString()}`;
        }
      }
      
      try {
        // Intentar obtener de la API
        const courses = await apiClient.get<ICourseData[]>(endpoint);
        // Guardar en caché
        saveToCache(cacheKey, courses);
        return courses;
      } catch (error) {
        console.error('Error fetching public courses, trying cache:', error);
        // Si hay error, intentar usar caché
        const cachedData = getFromCache(cacheKey);
        if (cachedData) {
          console.log('Using cached public courses data');
          return cachedData;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in getPublicCourses:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene un curso público por ID
   */
  async getPublicCourseById(courseId: string): Promise<ICourseData | null> {
    try {
      const cacheKey = `public_course_${courseId}`;
      
      try {
        // Intentar obtener de la API
        const course = await apiClient.get<ICourseData>(`/public/courses/${courseId}`);
        // Guardar en caché
        saveToCache(cacheKey, course);
        return course;
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        
        console.error('Error fetching public course by ID, trying cache:', error);
        // Si hay error, intentar usar caché
        const cachedData = getFromCache(cacheKey);
        if (cachedData) {
          console.log('Using cached public course data');
          return cachedData;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in getPublicCourseById:', error);
      return null;
    }
  },
  
  /**
   * Obtiene cursos publicados (autenticado)
   */
  async getPublishedCourses(params?: FetchParams, walletAddress?: string): Promise<ICourseData[]> {
    try {
      let endpoint = '/courses';
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        if (params.instructor) queryParams.append('instructor', params.instructor);
        
        if (queryParams.toString()) {
          endpoint += `?${queryParams.toString()}`;
        }
      }
      
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      return await apiClient.get<ICourseData[]>(endpoint, options);
    } catch (error) {
      console.error('Error fetching published courses:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene todos los cursos (para moderadores)
   */
  async getAllCoursesForModerator(walletAddress: string): Promise<ICourseData[]> {
    try {
      const options = apiClient.setAuthHeader(walletAddress);
      return await apiClient.get<ICourseData[]>('/admin/courses', options);
    } catch (error) {
      console.error('Error fetching all courses for moderator:', error);
      throw error;
    }
  },
  
  /**
   * Obtiene un curso por ID (autenticado)
   */
  async getCourseById(courseId: string, walletAddress?: string): Promise<ICourseData | null> {
    try {
      const cacheKey = `course_${courseId}`;
      
      // Verificar si hay una wallet en localStorage como respaldo
      if (!walletAddress) {
        try {
          const savedUser = localStorage.getItem('authUser');
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            if (parsedUser && parsedUser.walletAddress) {
              walletAddress = parsedUser.walletAddress;
            }
          }
        } catch (err) {
          console.warn('Error accessing localStorage:', err);
        }
      }
      
      const options = walletAddress ? apiClient.setAuthHeader(walletAddress) : {};
      
      try {
        const course = await apiClient.get<ICourseData>(`/courses/${courseId}`, options);
        saveToCache(cacheKey, course);
        return course;
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
        
        console.error('Error fetching course by ID, trying cache:', error);
        // Si hay error, intentar usar caché
        const cachedData = getFromCache(cacheKey, 300000); // 5 minutos para contenido autenticado
        if (cachedData) {
          console.log('Using cached course data');
          return cachedData;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error in getCourseById:', error);
      return null;
    }
  },
  
  /**
   * Cambia el estado de publicación de un curso
   */
  async toggleCoursePublishStatus(courseId: string, walletAddress: string): Promise<{ published: boolean, message: string }> {
    try {
      const options = apiClient.setAuthHeader(walletAddress);
      return await apiClient.patch<{ published: boolean, message: string }>(
        `/courses/${courseId}/publish`, 
        {},
        options
      );
    } catch (error) {
      console.error('Error toggling course publish status:', error);
      throw error;
    }
  },
  
  /**
   * Elimina un curso
   */
  async deleteCourse(courseId: string, walletAddress: string): Promise<{ message: string }> {
    try {
      const options = apiClient.setAuthHeader(walletAddress);
      return await apiClient.delete<{ message: string }>(
        `/courses/${courseId}`,
        options
      );
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  },
  
  /**
   * Crea un nuevo curso
   */
  async createCourse(
    courseData: Omit<ICourseData, '_id' | 'createdAt' | 'published' | 'instructor'>,
    walletAddress: string
  ): Promise<ICourseData> {
    try {
      const options = apiClient.setAuthHeader(walletAddress);
      return await apiClient.post<ICourseData>(
        '/courses',
        courseData,
        options
      );
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  },
  
  /**
   * Actualiza un curso existente
   */
  async updateCourse(
    courseId: string,
    courseData: Partial<Omit<ICourseData, '_id' | 'createdAt' | 'published' | 'instructor'>>,
    walletAddress: string
  ): Promise<ICourseData> {
    try {
      const options = apiClient.setAuthHeader(walletAddress);
      return await apiClient.put<ICourseData>(
        `/courses/${courseId}`,
        courseData,
        options
      );
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }
};

// Exportar el servicio de cursos con el método setWalletAddress añadido
export const courseService = {
  ...courseApi,
  
  // Añadir el método setWalletAddress que usan los componentes
  setWalletAddress(walletAddress: string) {
    // Utilizar el método del apiClient para establecer la cabecera de autenticación
    apiClient.setAuthHeader(walletAddress);
    return walletAddress;
  }
}; 
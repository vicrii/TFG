import { apiClient } from '../api/api.client';

export interface IGlobalStats {
  dailyActiveUsers: { date: string; count: number }[];
  popularCourses: { courseId: string; title: string; userCount: number; activityCount: number }[];
  examStatistics: { 
    courseId: string;
    title: string; 
    totalAttempts: number; 
    passedAttempts: number; 
    avgScore: number;
    passRate: number; 
  }[];
  totalUsers?: number;
  totalCourses?: number;
}

export interface IPublicStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  dailyActiveUsers: { date: string; count: number }[];
  popularCourses: { courseId: string; title: string; userCount: number; activityCount: number }[];
  examStatistics: { 
    courseId: string;
    title: string; 
    totalAttempts: number; 
    passedAttempts: number; 
    avgScore: number;
    passRate: number; 
  }[];
}

export interface ICourseStats {
  courseId: string;
  title: string;
  enrollments: number;
  completions: number;
  averageProgress: number;
  lessonViews: { lessonId: string; views: number }[];
}

class AnalyticsService {
  private walletAddress: string | null = null;

  setWalletAddress(address: string) {
    this.walletAddress = address;
  }

  clearWalletAddress() {
    this.walletAddress = null;
  }

  async getPublicStats(): Promise<IPublicStats> {
    try {
      const response = await apiClient.get<IPublicStats>('/analytics/public');
      return response;
    } catch (error: any) {
      console.error('Error fetching public stats:', error);
      // En caso de error, devolver valores básicos
      return {
        totalUsers: 0,
        totalCourses: 0,
        totalLessons: 0,
        dailyActiveUsers: [],
        popularCourses: [],
        examStatistics: []
      };
    }
  }

  async getGlobalStats(): Promise<IGlobalStats> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not set');
    }

    try {
      const response = await apiClient.get<IGlobalStats>('/analytics/global', {
        headers: {
          'x-wallet-address': this.walletAddress
        }
      });
      return response;
    } catch (error: any) {
      console.error('Error fetching global stats:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas globales');
    }
  }

  async getCourseStats(courseId: string): Promise<ICourseStats> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not set');
    }

    try {
      const response = await apiClient.get<ICourseStats>(`/analytics/course/${courseId}`, {
        headers: {
          'x-wallet-address': this.walletAddress
        }
      });
      return response;
    } catch (error: any) {
      console.error('Error fetching course stats:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener estadísticas del curso');
    }
  }

  async getUserProgress(): Promise<any> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not set');
    }

    try {
      const response = await apiClient.get<any>('/analytics/progress', {
        headers: {
          'x-wallet-address': this.walletAddress
        }
      });
      return response;
    } catch (error: any) {
      console.error('Error fetching user progress:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener progreso del usuario');
    }
  }

  async trackActivity(activityData: any): Promise<void> {
    if (!this.walletAddress) {
      throw new Error('Wallet address not set');
    }

    try {
      await apiClient.post('/analytics/activity', activityData, {
        headers: {
          'x-wallet-address': this.walletAddress
        }
      });
    } catch (error: any) {
      console.error('Error tracking activity:', error);
      // No lanzar error para no interrumpir la experiencia del usuario
    }
  }
}

export const analyticsService = new AnalyticsService(); 
import { apiClient } from '../api/api.client';
import { ICourseData } from '../course/courseService';

// Interfaces
export interface User {
  _id: string;
  walletAddress: string;
  displayName: string;
  email?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface UserCourse {
  _id: string;
  course: ICourseData;
  enrolledAt: string;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
  lastActivityDate: string;
}

export interface UserStats {
  totalCourses: number;
  completedCourses: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
  totalTimeSpent: number; // en minutos
  lastActive: string;
}

// API client for user-related endpoints
export const userApi = {
  /**
   * Get all users (requires moderator permissions)
   */
  async getAllUsers(walletAddress?: string): Promise<User[]> {
    try {
      const headers = walletAddress ? { 'x-wallet-address': walletAddress } : undefined;
      return await apiClient.get<User[]>('/users', { headers });
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  },

  /**
   * Get detailed information for a single user
   */
  async getUserDetails(userId: string): Promise<User> {
    try {
      return await apiClient.get<User>(`/users/${userId}`);
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  /**
   * Update a user's profile
   */
  async updateUser(walletAddress: string, userData: Partial<User>): Promise<User> {
    try {
      return await apiClient.put<User>(`/users/${walletAddress}`, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  /**
   * Update a user's role (requires moderator permissions)
   */
  async updateUserRole(userId: string, role: string, walletAddress?: string): Promise<User> {
    try {
      const headers = walletAddress ? { 'x-wallet-address': walletAddress } : undefined;
      return await apiClient.patch<User>(`/users/${userId}/role`, { role }, { headers });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  /**
   * Toggle user active status (requires moderator permissions)
   */
  async toggleUserActive(userId: string, isActive: boolean): Promise<User> {
    try {
      return await apiClient.patch<User>(`/users/${userId}/active`, { isActive });
    } catch (error) {
      console.error('Error toggling user active status:', error);
      throw error;
    }
  },

  /**
   * Get the courses a user is enrolled in (requires moderator permissions)
   */
  async getUserCourses(userId: string, walletAddress?: string): Promise<UserCourse[]> {
    try {
      const headers = walletAddress ? { 'x-wallet-address': walletAddress } : undefined;
      return await apiClient.get<UserCourse[]>(`/users/${userId}/courses`, { headers });
    } catch (error) {
      console.error('Error fetching user courses:', error);
      // Temporary fallback for demo purposes
      return [];
    }
  },

  /**
   * Get user learning statistics (requires moderator permissions)
   */
  async getUserStats(userId: string, walletAddress?: string): Promise<UserStats> {
    try {
      const headers = walletAddress ? { 'x-wallet-address': walletAddress } : undefined;
      return await apiClient.get<UserStats>(`/users/${userId}/stats`, { headers });
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      // Return mock data for demo purposes
      return {
        totalCourses: Math.floor(Math.random() * 10),
        completedCourses: Math.floor(Math.random() * 5),
        totalLessons: Math.floor(Math.random() * 50),
        completedLessons: Math.floor(Math.random() * 30),
        averageProgress: Math.floor(Math.random() * 100),
        totalTimeSpent: Math.floor(Math.random() * 5000),
        lastActive: new Date().toISOString()
      };
    }
  }
};

// Exportar el servicio de usuarios con el método setWalletAddress añadido
export const userService = {
  ...userApi,
  
  setWalletAddress(walletAddress: string) {
    // Utilizar el método del apiClient para establecer la cabecera de autenticación
    apiClient.setAuthHeader(walletAddress);
    return walletAddress;
  }
}; 
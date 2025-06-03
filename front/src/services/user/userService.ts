// Reexportar todo desde el módulo de user.api.ts
export * from './user.api';

// Import and re-export individual functions from the API
import { userApi } from './user.api';

// Re-export individual functions for direct import
export const getAllUsers = userApi.getAllUsers;
export const getUserDetails = userApi.getUserDetails;
export const updateUser = userApi.updateUser;
export const updateUserRole = userApi.updateUserRole;
export const toggleUserActive = userApi.toggleUserActive;
export const getUserCourses = userApi.getUserCourses;
export const getUserStats = userApi.getUserStats; 
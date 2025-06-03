// Reexportar todo desde el módulo de course.api.ts
export * from './course.api';

// Import and re-export individual functions from the API
import { courseApi, courseService as apiCourseService } from './course.api';

// Re-export individual functions for direct import
export const getCourseById = courseApi.getCourseById;
export const getPublicCourseById = courseApi.getPublicCourseById;
export const updateCourse = courseApi.updateCourse;
export const getAllCoursesForModerator = courseApi.getAllCoursesForModerator;
export const toggleCoursePublishStatus = courseApi.toggleCoursePublishStatus;
export const deleteCourse = courseApi.deleteCourse;
export const createCourse = courseApi.createCourse;
export const getPublicCourses = courseApi.getPublicCourses;
export const getPublishedCourses = courseApi.getPublishedCourses;

// Alias for getAllCourses that uses the moderator function
export const getAllCourses = courseApi.getAllCoursesForModerator;

// Export the service object from the API that already has setWalletAddress
export const courseService = {
  ...apiCourseService,
  getAllCourses: courseApi.getAllCoursesForModerator
}; 
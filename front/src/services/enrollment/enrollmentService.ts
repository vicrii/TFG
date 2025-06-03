// Reexportar todo desde el módulo de enrollment.api.ts
export * from './enrollment.api';

// Import and re-export individual functions from the API
import { enrollmentApi } from './enrollment.api';

// Re-export individual functions for direct import
export const getEnrolledCourses = enrollmentApi.getEnrolledCourses;
export const getBasicEnrollments = enrollmentApi.getBasicEnrollments;
export const enrollInCourse = enrollmentApi.enrollInCourse;
export const unenrollFromCourse = enrollmentApi.unenrollFromCourse;
export const checkEnrollmentStatus = enrollmentApi.checkEnrollmentStatus; 
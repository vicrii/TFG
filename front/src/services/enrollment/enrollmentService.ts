export * from './enrollment.api';

import { enrollmentApi } from './enrollment.api';

export const getEnrolledCourses = enrollmentApi.getEnrolledCourses;
export const getBasicEnrollments = enrollmentApi.getBasicEnrollments;
export const enrollInCourse = enrollmentApi.enrollInCourse;
export const unenrollFromCourse = enrollmentApi.unenrollFromCourse;
export const checkEnrollmentStatus = enrollmentApi.checkEnrollmentStatus; 
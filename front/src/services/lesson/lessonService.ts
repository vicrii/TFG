// Reexportar todo desde el módulo de lesson.api.ts
export * from './lesson.api';

// Import and re-export individual functions from the API
import { lessonApi } from './lesson.api';

// Re-export individual functions for direct import
export const getCourseLessons = lessonApi.getCourseLessons;
export const getLessonById = lessonApi.getLessonById;
export const createLesson = lessonApi.createLesson;
export const updateLesson = lessonApi.updateLesson;
export const deleteLesson = lessonApi.deleteLesson;
export const markLessonAsCompleted = lessonApi.markLessonAsCompleted;
export const markQuizCompleted = lessonApi.markQuizCompleted;
export const markCodeExerciseCompleted = lessonApi.markCodeExerciseCompleted; 
export const markLessonAsViewed = lessonApi.markLessonAsViewed; 
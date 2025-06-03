import { Types } from 'mongoose';

// Tipos seguros para usar en las conversiones
export type CourseIdType = string | Types.ObjectId;

export interface CourseBasicInfo {
  _id: CourseIdType;
  title?: string;
  description?: string;
  imageUrl?: string;
  level?: string;
  instructor?: string;
  tags?: string[];
  published?: boolean;
}

export interface PopulatedEnrollment {
  _id: Types.ObjectId | string;
  course: CourseBasicInfo;
  user: Types.ObjectId | string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'dropped';
  progress: number;
}

// Helper para extraer el ID del curso de forma segura
export function getCourseId(course: any): CourseIdType {
  if (typeof course === 'object' && course) {
    return course._id || course;
  }
  return course;
}

// Helper para crear un objeto curso simple desde cualquier valor
export function safeCourseSummary(course: any): CourseBasicInfo {
  if (typeof course !== 'object' || !course) {
    return { _id: String(course), title: 'Título no disponible' };
  }
  
  return {
    _id: course._id || course,
    title: String(course.title || 'Título no disponible'),
    description: String(course.description || 'Sin descripción'),
    imageUrl: String(course.imageUrl || ''),
    level: String(course.level || 'básico'),
    instructor: String(course.instructor || ''),
    tags: Array.isArray(course.tags) ? course.tags : []
  };
} 
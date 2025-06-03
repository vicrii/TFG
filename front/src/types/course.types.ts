import { ICourseData } from '../services/course/course.api';

export interface Instructor {
  _id: string;
  displayName: string;
  email?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  instructor: Instructor | string;
}

export interface CourseCardProps {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  instructor: Instructor | string;
}

export interface CourseListProps {
  courses: ICourseData[];
}

export interface FeaturedCourseSectionProps {
  courses: Course[];
  title?: string;
  subtitle?: string;
}

export interface EnrolledCourseCardProps {
  course: Course;
  progress: number;
  lastAccessed?: Date;
  onContinue?: () => void;
  isEnrolled?: boolean;
  enrolledAt?: string;
} 
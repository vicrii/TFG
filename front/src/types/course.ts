interface Instructor {
  walletAddress: string;
  displayName: string;
}

export interface Course {
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
  totalDuration?: number;
  totalLessons?: number;
  completedLessons?: number;
  createdAt: Date;
  updatedAt: Date;
} 
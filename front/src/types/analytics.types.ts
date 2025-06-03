export interface CourseStatsDashboardProps {
  courseId: string;
  courseName: string;
}

export interface ProgressStats {
  completedLessons: { 
    _id: string; 
    count: number;
    courseName: string;
  }[];
  totalStudyTime: number;
  examStats: {
    total: number;
    passed: number;
    passRate: number;
  };
  recentActivity: {
    _id: string;
    user: string;
    course: {
      _id: string;
      title: string;
    };
    lesson: {
      _id: string;
      title: string;
    };
    activityType: string;
    durationSeconds: number;
    createdAt: string;
  }[];
  skillLevels?: {
    skill: string;
    level: number;
    maxLevel: number;
  }[];
  streakData?: {
    currentStreak: number;
    longestStreak: number;
    lastActive: string;
    streakHistory: {
      date: string;
      active: boolean;
    }[];
  };
  weeklyActivity?: {
    day: string;
    minutes: number;
  }[];
  completionRate?: number;
  nextRecommendations?: {
    _id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedTime: number;
  }[];
}

export interface UserProgressSummaryProps {
  progress: ProgressStats;
} 
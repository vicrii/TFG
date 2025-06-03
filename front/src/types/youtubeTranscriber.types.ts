export interface TranscriptionResult {
  title: string;
  transcription: string;
  summary: string;
  lessons?: string[] | EnhancedLesson[];
  progress?: number;
  status?: string;
  videoDuration?: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface CodeExercise {
  id: string;
  title: string;
  description: string;
  language: string;
  initialCode: string;
  solution: string;
  hint: string;
  expectedOutput: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    description: string;
  }>;
}

export interface EnhancedLesson {
  title: string;
  content?: string;
  quizQuestions?: QuizQuestion[];
  codeExercises?: CodeExercise[];
}

export interface Lesson {
  title: string;
  content: string;
  quizQuestions?: QuizQuestion[];
  codeExercises?: CodeExercise[];
}

export interface CourseFormData {
  title: string;
  description: string;
  content: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  tags: string[];
  imageUrl: string;
  lessons: Lesson[];
} 
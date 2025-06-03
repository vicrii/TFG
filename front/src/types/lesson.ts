export interface QuizQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface CodeTestCase {
  input: string;
  expectedOutput: string;
  description?: string;
}

// Interfaz para ejercicios de código
export interface CodeExercise {
  id?: string;
  title: string;
  description: string;
  language: string;
  initialCode: string;
  solution: string;
  hint?: string;
  expectedOutput?: string;
  isCompleted?: boolean;
  testCases?: CodeTestCase[];
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  content: string;
  course: string; // Course ID
  order: number;
  videoUrl?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
  quizQuestions?: QuizQuestion[];
  codeExercises?: CodeExercise[]; // Añadido ejercicios de código
  isCompleted?: boolean;
  isLocked?: boolean;
  requiredToProgress?: boolean;
  minQuizScore?: number; // Porcentaje mínimo para aprobar el quiz (0-100)
  // NUEVOS CAMPOS para tracking separado
  quizCompleted?: boolean;
  quizScore?: number;
  codeExercisesCompleted?: boolean;
  completedCodeExercises?: string[];
} 
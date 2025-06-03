# Esquema de Base de Datos

## Modelos

### Usuario (User)
```typescript
interface UserSettings {
  displayName?: string;
  email?: string;
  profileImage?: string;
  notificationPreferences?: {
    emailNotifications: boolean;
    courseUpdates: boolean;
    examReminders: boolean;
    achievements: boolean;
  };
  privacySettings?: {
    showProgress: boolean;
    showActivity: boolean;
    showAchievements: boolean;
  };
  uiPreferences?: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    codeEditorTheme: 'vs-dark' | 'light';
  };
}

interface IUser {
  walletAddress: string;      // Único, requerido
  displayName: string;        // Requerido
  email: string;             // Único, requerido
  bio?: string;              // Máximo 500 caracteres
  role: 'student' | 'instructor' | 'admin' | 'moderator';
  settings?: UserSettings;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Curso (Course)
```typescript
interface ICourse {
  title: string;             // Máximo 100 caracteres
  description: string;       // Máximo 500 caracteres
  content: string;
  imageUrl?: string;
  instructor: string;        // Referencia a wallet del instructor
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  published: boolean;
  totalDuration?: number;    // Duración total en minutos
  totalLessons?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Lección (Lesson)
```typescript
interface ILesson {
  title: string;
  content: string;
  course: string;           // Referencia al ID del curso
  order: number;           // Orden en el curso
  duration: number;        // Duración en minutos
  type: 'video' | 'text' | 'quiz' | 'code';
  resources?: string[];    // URLs de recursos adicionales
  createdAt: Date;
  updatedAt: Date;
}
```

### Progreso de Lección (LessonProgress)
```typescript
interface ILessonProgress {
  user: string;            // Referencia a wallet del usuario
  lesson: string;          // Referencia al ID de la lección
  completed: boolean;
  progress: number;        // Porcentaje de progreso (0-100)
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Actividad de Usuario (UserActivity)
```typescript
interface IUserActivity {
  user: string;            // Referencia a wallet del usuario
  type: 'login' | 'course_start' | 'lesson_complete' | 'quiz_complete';
  details: any;            // Detalles específicos de la actividad
  createdAt: Date;
}
```

### Matriculación (Enrollment)
```typescript
interface IEnrollment {
  user: string;            // Referencia a wallet del usuario
  course: string;          // Referencia al ID del curso
  status: 'active' | 'completed' | 'dropped';
  startDate: Date;
  completionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Pregunta (Question)
```typescript
interface IQuestion {
  lesson: string;          // Referencia al ID de la lección
  text: string;
  type: 'multiple_choice' | 'true_false' | 'code';
  options?: string[];      // Para preguntas de opción múltiple
  correctAnswer: string;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Relaciones

1. **Usuario - Curso**
   - Un usuario (instructor) puede crear múltiples cursos
   - Un usuario (estudiante) puede estar matriculado en múltiples cursos

2. **Curso - Lección**
   - Un curso contiene múltiples lecciones
   - Las lecciones están ordenadas dentro del curso

3. **Usuario - Lección**
   - Un usuario puede tener progreso en múltiples lecciones
   - Se registra la actividad del usuario en las lecciones

4. **Usuario - Matriculación**
   - Un usuario puede tener múltiples matriculaciones
   - Cada matriculación está asociada a un curso

## Índices

- `User.walletAddress`: Índice único
- `User.email`: Índice único
- `Course.instructor`: Índice para búsquedas por instructor
- `Lesson.course`: Índice para búsquedas de lecciones por curso
- `LessonProgress.user`: Índice para búsquedas de progreso por usuario
- `Enrollment.user`: Índice para búsquedas de matriculaciones por usuario
- `Enrollment.course`: Índice para búsquedas de matriculaciones por curso 
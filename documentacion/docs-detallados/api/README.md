# 🔌 Documentación API - Proyecto DAW

## 📋 Información General

La **API REST** de la Plataforma de Aprendizaje Blockchain está construida siguiendo los principios de **arquitectura MVC** y estándares REST modernos. Proporciona endpoints para gestión de usuarios, cursos, lecciones y analytics.

### **URLs Base**
- **Desarrollo**: `http://localhost:5000/api`
- **Producción**: `https://solanalearn.up.railway.app/api`

### **Características**
- ✅ **RESTful**: Verbos HTTP estándar
- ✅ **JSON**: Formato de intercambio de datos
- ✅ **JWT**: Autenticación stateless
- ✅ **CORS**: Configurado para seguridad
- ✅ **Rate Limiting**: Protección contra abuso
- ✅ **Validación**: Esquemas estrictos
- ✅ **Documentación**: OpenAPI/Swagger

---

## 🔐 Autenticación

### **Métodos de Autenticación**

#### **1. JWT Token (Recomendado)**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "usuario@email.com",
    "displayName": "Usuario Ejemplo",
    "role": "student"
  }
}
```

#### **2. Wallet Authentication**
```http
POST /api/auth/wallet
Content-Type: application/json

{
  "walletAddress": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  "signature": "signature-from-wallet"
}
```

### **Uso del Token**
```http
GET /api/protected-endpoint
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Renovación de Token**
```http
POST /api/auth/refresh
Authorization: Bearer current-token
```

---

## 👥 Endpoints de Usuarios

### **Obtener Usuarios**

#### **GET /api/users**
Obtiene lista de usuarios (solo admin)

**Headers:**
```http
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `page` (number): Página (default: 1)
- `limit` (number): Límite por página (default: 10)
- `role` (string): Filtrar por rol
- `search` (string): Buscar por nombre/email

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "usuario@email.com",
        "displayName": "Usuario Ejemplo",
        "role": "student",
        "createdAt": "2024-01-15T10:30:00Z",
        "isActive": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15
    }
  }
}
```

### **Obtener Usuario por ID**

#### **GET /api/users/:id**
Obtiene información de un usuario específico

**Parámetros:**
- `id` (string): ID del usuario

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "usuario@email.com",
    "displayName": "Usuario Ejemplo",
    "bio": "Desarrollador apasionado por blockchain",
    "role": "student",
    "walletAddress": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
    "enrolledCourses": ["507f1f77bcf86cd799439012"],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z"
  }
}
```

### **Crear Usuario**

#### **POST /api/users**
Crea un nuevo usuario

**Body:**
```json
{
  "email": "nuevo@email.com",
  "displayName": "Nuevo Usuario",
  "password": "password123",
  "role": "student",
  "bio": "Biografía opcional"
}
```

**Validaciones:**
- `email`: Requerido, formato email válido, único
- `displayName`: Requerido, mínimo 3 caracteres
- `password`: Requerido, mínimo 6 caracteres
- `role`: Opcional, valores válidos: student, instructor, admin

### **Actualizar Usuario**

#### **PUT /api/users/:id**
Actualiza información de usuario

**Permisos:** Usuario propietario o admin

**Body:**
```json
{
  "displayName": "Nombre Actualizado",
  "bio": "Nueva biografía",
  "role": "instructor"
}
```

### **Eliminar Usuario**

#### **DELETE /api/users/:id**
Elimina usuario (solo admin)

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente"
}
```

---

## 📚 Endpoints de Cursos

### **Obtener Cursos**

#### **GET /api/courses**
Lista todos los cursos públicos

**Query Parameters:**
- `page` (number): Página
- `limit` (number): Límite por página
- `category` (string): Filtrar por categoría
- `level` (string): Filtrar por nivel
- `search` (string): Buscar en título/descripción

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "507f1f77bcf86cd799439012",
        "title": "Introducción a Blockchain",
        "description": "Aprende los fundamentos de blockchain",
        "instructor": {
          "id": "507f1f77bcf86cd799439013",
          "displayName": "Instructor Ejemplo"
        },
        "category": "blockchain",
        "level": "beginner",
        "price": 0,
        "estimatedHours": 10,
        "lessonsCount": 8,
        "enrolledCount": 1250,
        "rating": 4.8,
        "imageUrl": "https://example.com/course-image.jpg",
        "published": true,
        "createdAt": "2024-01-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 45,
      "pages": 4
    }
  }
}
```

### **Obtener Curso por ID**

#### **GET /api/courses/:id**
Obtiene detalles completos de un curso

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "title": "Introducción a Blockchain",
    "description": "Curso completo sobre fundamentos de blockchain...",
    "instructor": {
      "id": "507f1f77bcf86cd799439013",
      "displayName": "Instructor Ejemplo",
      "bio": "Experto en blockchain con 5 años de experiencia"
    },
    "category": "blockchain",
    "level": "beginner",
    "price": 0,
    "estimatedHours": 10,
    "requirements": [
      "Conocimientos básicos de programación",
      "Interés en tecnología blockchain"
    ],
    "learningObjectives": [
      "Comprender qué es blockchain",
      "Conocer casos de uso principales",
      "Crear tu primera transacción"
    ],
    "lessons": [
      {
        "id": "507f1f77bcf86cd799439014",
        "title": "¿Qué es Blockchain?",
        "description": "Introducción a los conceptos básicos",
        "order": 1,
        "duration": 900,
        "type": "video"
      }
    ],
    "published": true,
    "createdAt": "2024-01-10T08:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### **Crear Curso**

#### **POST /api/courses**
Crea un nuevo curso (solo instructores)

**Headers:**
```http
Authorization: Bearer <instructor-token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Mi Nuevo Curso",
  "description": "Descripción detallada del curso",
  "category": "blockchain",
  "level": "intermediate",
  "price": 49.99,
  "estimatedHours": 15,
  "requirements": [
    "Conocimientos básicos de JavaScript"
  ],
  "learningObjectives": [
    "Objetivo 1",
    "Objetivo 2"
  ]
}
```

**Validaciones:**
- `title`: Requerido, mínimo 5 caracteres
- `description`: Requerido, mínimo 50 caracteres
- `category`: Requerido, valores válidos predefinidos
- `level`: Requerido (beginner, intermediate, advanced)
- `price`: Número >= 0

### **Actualizar Curso**

#### **PUT /api/courses/:id**
Actualiza un curso existente

**Permisos:** Instructor propietario o admin

### **Eliminar Curso**

#### **DELETE /api/courses/:id**
Elimina un curso

**Permisos:** Instructor propietario o admin

### **Inscribirse en Curso**

#### **POST /api/courses/:id/enroll**
Inscribe al usuario autenticado en un curso

**Headers:**
```http
Authorization: Bearer <user-token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Inscripción exitosa",
  "data": {
    "enrollmentId": "507f1f77bcf86cd799439015",
    "enrolledAt": "2024-01-20T10:30:00Z"
  }
}
```

---

## 📖 Endpoints de Lecciones

### **Obtener Lecciones de Curso**

#### **GET /api/courses/:courseId/lessons**
Obtiene todas las lecciones de un curso

**Permisos:** Usuario inscrito o instructor del curso

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": "507f1f77bcf86cd799439014",
        "title": "¿Qué es Blockchain?",
        "description": "Introducción a los conceptos básicos",
        "order": 1,
        "duration": 900,
        "type": "video",
        "videoUrl": "https://youtube.com/watch?v=...",
        "content": "<h1>Contenido HTML de la lección</h1>",
        "quizQuestions": [
          {
            "question": "¿Qué es blockchain?",
            "options": [
              "Una base de datos",
              "Una red descentralizada",
              "Un tipo de criptomoneda",
              "Un protocolo de internet"
            ],
            "correctAnswerIndex": 1,
            "explanation": "Blockchain es una red descentralizada..."
          }
        ],
        "codeExercises": [
          {
            "id": "507f1f77bcf86cd799439016",
            "title": "Crear una transacción simple",
            "description": "Implementa una función que cree una transacción",
            "language": "javascript",
            "initialCode": "function createTransaction() {\n  // Tu código aquí\n}",
            "solution": "function createTransaction(from, to, amount) {\n  return { from, to, amount, timestamp: Date.now() };\n}",
            "testCases": [
              {
                "input": ["Alice", "Bob", 100],
                "expectedOutput": { "from": "Alice", "to": "Bob", "amount": 100 }
              }
            ]
          }
        ],
        "isCompleted": false,
        "progress": {
          "viewed": true,
          "quizCompleted": false,
          "codeExercisesCompleted": []
        }
      }
    ]
  }
}
```

### **Obtener Lección por ID**

#### **GET /api/lessons/:id**
Obtiene detalles completos de una lección

### **Crear Lección**

#### **POST /api/courses/:courseId/lessons**
Crea nueva lección en un curso

**Permisos:** Instructor del curso o admin

**Body:**
```json
{
  "title": "Nueva Lección",
  "description": "Descripción de la lección",
  "order": 2,
  "type": "video",
  "videoUrl": "https://youtube.com/watch?v=...",
  "content": "<p>Contenido HTML de la lección</p>",
  "duration": 1200
}
```

### **Marcar Lección como Completada**

#### **POST /api/lessons/:id/complete**
Marca una lección como vista/completada

**Headers:**
```http
Authorization: Bearer <user-token>
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Lección marcada como completada",
  "data": {
    "progress": 75,
    "completedAt": "2024-01-20T15:30:00Z"
  }
}
```

---

## ❓ Endpoints de Evaluaciones

### **Completar Quiz**

#### **POST /api/lessons/:lessonId/quiz/complete**
Envía respuestas del quiz y obtiene calificación

**Body:**
```json
{
  "answers": [1, 0, 2, 1],
  "timeSpent": 300
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "passed": true,
    "correctAnswers": 3,
    "totalQuestions": 4,
    "results": [
      {
        "questionIndex": 0,
        "correct": true,
        "selectedAnswer": 1,
        "correctAnswer": 1
      },
      {
        "questionIndex": 1,
        "correct": false,
        "selectedAnswer": 0,
        "correctAnswer": 2,
        "explanation": "La respuesta correcta es..."
      }
    ],
    "completedAt": "2024-01-20T16:00:00Z"
  }
}
```

### **Ejecutar Ejercicio de Código**

#### **POST /api/lessons/:lessonId/exercises/:exerciseId/run**
Ejecuta y evalúa código de ejercicio

**Body:**
```json
{
  "code": "function createTransaction(from, to, amount) {\n  return { from, to, amount, timestamp: Date.now() };\n}"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "passed": true,
    "score": 100,
    "testResults": [
      {
        "testCase": 1,
        "passed": true,
        "input": ["Alice", "Bob", 100],
        "expectedOutput": { "from": "Alice", "to": "Bob", "amount": 100 },
        "actualOutput": { "from": "Alice", "to": "Bob", "amount": 100, "timestamp": 1705750800000 }
      }
    ],
    "executionTime": 45,
    "memoryUsed": 1024
  }
}
```

---

## 📊 Endpoints de Analytics

### **Métricas de Usuario**

#### **GET /api/analytics/user/:userId**
Obtiene métricas de progreso de un usuario

**Permisos:** Usuario propietario o admin

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "overview": {
      "coursesEnrolled": 5,
      "coursesCompleted": 2,
      "totalStudyTime": 3600,
      "averageScore": 87.5,
      "certificatesEarned": 2
    },
    "courseProgress": [
      {
        "courseId": "507f1f77bcf86cd799439012",
        "title": "Introducción a Blockchain",
        "progress": 100,
        "completed": true,
        "enrolledAt": "2024-01-15T10:30:00Z",
        "completedAt": "2024-01-18T16:45:00Z",
        "finalScore": 92
      }
    ],
    "recentActivity": [
      {
        "type": "lesson_completed",
        "lessonTitle": "Crear Smart Contracts",
        "timestamp": "2024-01-20T14:30:00Z"
      }
    ]
  }
}
```

### **Métricas de Curso**

#### **GET /api/analytics/course/:courseId**
Obtiene estadísticas de un curso

**Permisos:** Instructor del curso o admin

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "courseId": "507f1f77bcf86cd799439012",
    "overview": {
      "totalEnrollments": 1250,
      "completions": 890,
      "completionRate": 71.2,
      "averageRating": 4.8,
      "averageStudyTime": 8.5
    },
    "enrollmentTrend": [
      { "date": "2024-01-01", "enrollments": 45 },
      { "date": "2024-01-02", "enrollments": 52 }
    ],
    "lessonPerformance": [
      {
        "lessonId": "507f1f77bcf86cd799439014",
        "title": "¿Qué es Blockchain?",
        "completionRate": 95.2,
        "averageScore": 88.5,
        "averageTimeSpent": 15.2
      }
    ]
  }
}
```

### **Métricas Globales**

#### **GET /api/analytics/global**
Obtiene métricas generales del sistema (solo admin)

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 15420,
      "active": 8250,
      "newThisMonth": 1250
    },
    "courses": {
      "total": 145,
      "published": 120,
      "categories": {
        "blockchain": 45,
        "web3": 35,
        "defi": 25
      }
    },
    "engagement": {
      "totalStudyHours": 125000,
      "averageSessionDuration": 28.5,
      "dailyActiveUsers": 2500
    }
  }
}
```

---

## 🔧 Endpoints de Sistema

### **Health Check**

#### **GET /api/health**
Verifica el estado del sistema

**Respuesta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T16:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "storage": "ok",
    "external_apis": "ok"
  },
  "metrics": {
    "uptime": 99.9,
    "responseTime": 145,
    "memoryUsage": 68.5,
    "diskUsage": 45.2
  }
}
```

### **Configuración**

#### **GET /api/config**
Obtiene configuración pública de la aplicación

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "appName": "Plataforma de Aprendizaje Blockchain",
    "version": "1.0.0",
    "features": {
      "walletAuth": true,
      "aiGeneration": true,
      "certificates": true
    },
    "limits": {
      "maxFileSize": 10,
      "maxVideoDuration": 3600
    }
  }
}
```

---

## 📝 Códigos de Estado HTTP

### **Códigos de Éxito**
- `200 OK`: Solicitud exitosa
- `201 Created`: Recurso creado exitosamente
- `204 No Content`: Operación exitosa sin contenido

### **Códigos de Error del Cliente**
- `400 Bad Request`: Datos inválidos en la solicitud
- `401 Unauthorized`: Token inválido o expirado
- `403 Forbidden`: Sin permisos para la operación
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Conflicto (ej: email duplicado)
- `422 Unprocessable Entity`: Validación de datos fallida
- `429 Too Many Requests`: Rate limit excedido

### **Códigos de Error del Servidor**
- `500 Internal Server Error`: Error interno del servidor
- `502 Bad Gateway`: Error de gateway
- `503 Service Unavailable`: Servicio no disponible

---

## 🔒 Seguridad

### **Rate Limiting**
```http
# Headers de respuesta para rate limiting
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642675200
```

### **Validación de Entrada**
- Todos los endpoints validan entrada usando Joi schemas
- Sanitización automática de datos
- Protección contra inyección SQL/NoSQL
- Límites de tamaño de payload

### **CORS**
```javascript
// Configuración CORS
{
  origin: ['http://localhost:5173', 'https://solanalearn.up.railway.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

---

## 📊 Formato de Respuesta

### **Respuesta Exitosa**
```json
{
  "success": true,
  "data": {
    // Datos de respuesta
  },
  "message": "Mensaje opcional",
  "timestamp": "2024-01-20T16:30:00Z"
}
```

### **Respuesta de Error**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [
      {
        "field": "email",
        "message": "El email es requerido"
      }
    ]
  },
  "timestamp": "2024-01-20T16:30:00Z"
}
```

### **Respuesta Paginada**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 150,
      "pages": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🧪 Testing

### **Ejemplos con cURL**

#### **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@email.com",
    "password": "password123"
  }'
```

#### **Obtener Cursos**
```bash
curl -X GET "http://localhost:5000/api/courses?page=1&limit=5" \
  -H "Accept: application/json"
```

#### **Crear Curso**
```bash
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Mi Nuevo Curso",
    "description": "Descripción del curso",
    "category": "blockchain",
    "level": "beginner"
  }'
```

### **Colección Postman**
Descarga la colección de Postman con todos los endpoints:
[📥 Download Postman Collection](api-collection.postman.json)

---

## 📚 SDK y Librerías

### **JavaScript/TypeScript Client**
```typescript
import { ApiClient } from '@plataforma/api-client';

const api = new ApiClient({
  baseURL: 'http://localhost:5000/api',
  token: 'your-jwt-token'
});

// Uso
const courses = await api.courses.getAll();
const user = await api.users.getById('user-id');
```

### **Python Client**
```python
from plataforma_client import ApiClient

client = ApiClient(
    base_url='http://localhost:5000/api',
    token='your-jwt-token'
)

# Uso
courses = client.courses.get_all()
user = client.users.get_by_id('user-id')
```

---

*Documentación API completa y actualizada 🚀* 
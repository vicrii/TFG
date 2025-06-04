# 🔌 API Reference - Plataforma Educativa

La API REST de la Plataforma Educativa proporciona acceso completo a todas las funcionalidades del sistema. Esta documentación describe todos los endpoints, parámetros, respuestas y ejemplos de uso.

## 🌐 Base URL

| Entorno | URL |
|---------|-----|
| **Development** | `http://localhost:5000/api` |
| **Production** | `https://tu-dominio.railway.app/api` |

## 🔐 Autenticación

La API utiliza autenticación basada en wallet de Solana. Todos los endpoints protegidos requieren el header:

```http
x-wallet-address: <wallet_public_key>
```

### Ejemplo:
```bash
curl -H "x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm" \
     http://localhost:5000/api/courses
```

## 📊 Formato de Respuesta

Todas las respuestas siguen un formato consistente:

### **Respuesta Exitosa**
```json
{
  "success": true,
  "data": {
    // Datos específicos del endpoint
  },
  "message": "Descripción de la operación",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Respuesta de Error**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Descripción del error",
    "details": {
      // Detalles adicionales del error
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🚀 Endpoints Principales

### **Health Check**
```http
GET /api/health
```

Verifica el estado del servidor y servicios.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "ai": "available"
  }
}
```

---

## 👥 Usuarios (`/api/users`)

### **Obtener Usuario**
```http
GET /api/users/{walletAddress}
```

**Parámetros:**
- `walletAddress` (string): Dirección pública de la wallet

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "walletAddress": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm",
    "displayName": "Juan Pérez",
    "email": "juan@email.com",
    "bio": "Desarrollador blockchain",
    "role": "instructor",
    "avatar": "https://...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "settings": {
      "notifications": true,
      "privacy": "public"
    }
  }
}
```

### **Crear/Actualizar Usuario**
```http
POST /api/users
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
Content-Type: application/json
```

**Body:**
```json
{
  "displayName": "Juan Pérez",
  "email": "juan@email.com",
  "bio": "Desarrollador blockchain especializado en Solana",
  "avatar": "https://example.com/avatar.jpg"
}
```

### **Obtener Configuraciones**
```http
GET /api/users/settings
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
```

---

## 📚 Cursos (`/api/courses`)

### **Listar Cursos Públicos**
```http
GET /api/courses/public
```

**Query Parameters:**
- `page` (number): Página (default: 1)
- `limit` (number): Límite por página (default: 10)
- `level` (string): Filtrar por nivel ('beginner', 'intermediate', 'advanced')
- `tags` (string): Filtrar por tags (separados por coma)
- `search` (string): Búsqueda en título y descripción

**Ejemplo:**
```bash
GET /api/courses/public?page=1&limit=5&level=beginner&tags=javascript,react
```

### **Obtener Curso Específico**
```http
GET /api/courses/{courseId}
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "_id": "course_id",
    "title": "Desarrollo en Solana",
    "description": "Aprende a desarrollar en Solana desde cero",
    "instructor": "instructor_wallet_address",
    "instructorInfo": {
      "displayName": "María González",
      "bio": "Expert en blockchain"
    },
    "price": 0.5,
    "level": "intermediate",
    "tags": ["solana", "blockchain", "web3"],
    "imageUrl": "https://...",
    "published": true,
    "totalLessons": 12,
    "totalDuration": 720,
    "enrollmentCount": 156,
    "rating": 4.7,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **Crear Curso**
```http
POST /api/courses
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Desarrollo en Solana",
  "description": "Aprende a desarrollar aplicaciones descentralizadas en Solana",
  "content": "Contenido detallado del curso...",
  "level": "intermediate",
  "price": 0.5,
  "tags": ["solana", "blockchain", "web3"],
  "imageUrl": "https://example.com/image.jpg"
}
```

### **Actualizar Curso**
```http
PUT /api/courses/{courseId}
```

### **Eliminar Curso**
```http
DELETE /api/courses/{courseId}
```

---

## 📖 Lecciones (`/api/lessons`)

### **Obtener Lecciones de un Curso**
```http
GET /api/lessons/by-course/{courseId}
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "lesson_id",
      "title": "Introducción a Solana",
      "description": "Conceptos básicos de Solana",
      "content": "<h2>Introducción</h2><p>Solana es...</p>",
      "videoUrl": "https://youtube.com/watch?v=...",
      "duration": 45,
      "order": 1,
      "isCompleted": false,
      "quizQuestions": [
        {
          "question": "¿Qué es Solana?",
          "options": ["Blockchain", "Token", "Wallet", "Exchange"],
          "correctAnswerIndex": 0
        }
      ],
      "codeExercises": [
        {
          "id": "ex1",
          "title": "Hello Solana",
          "description": "Crea tu primer programa",
          "language": "rust",
          "initialCode": "// Tu código aquí",
          "solution": "// Solución"
        }
      ]
    }
  ]
}
```

### **Crear Lección**
```http
POST /api/lessons/by-course/{courseId}
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Introducción a Solana",
  "description": "Conceptos básicos y arquitectura",
  "content": "<h2>Introducción</h2><p>En esta lección...</p>",
  "videoUrl": "https://youtube.com/watch?v=example",
  "duration": 45,
  "order": 1,
  "quizQuestions": [
    {
      "question": "¿Cuál es la principal ventaja de Solana?",
      "options": ["Velocidad", "Costo", "Seguridad", "Todas las anteriores"],
      "correctAnswerIndex": 3
    }
  ],
  "codeExercises": [
    {
      "id": "exercise_1",
      "title": "Hello World en Rust",
      "description": "Escribe tu primer programa",
      "language": "rust",
      "initialCode": "fn main() {\n    // Tu código aquí\n}",
      "solution": "fn main() {\n    println!(\"Hello, Solana!\");\n}",
      "hint": "Usa println! para mostrar texto",
      "expectedOutput": "Hello, Solana!"
    }
  ]
}
```

### **Marcar Lección como Completada**
```http
POST /api/lessons/{lessonId}/complete
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
```

---

## 🤖 Generación de Contenido con IA

### **Generar Contenido desde YouTube**
```http
POST /api/generate-lesson-content
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
Content-Type: application/json
```

**Body:**
```json
{
  "youtubeUrl": "https://youtube.com/watch?v=...",
  "contentType": "all",
  "generateMultipleLessons": true,
  "numberOfLessons": 3,
  "selectedLanguage": "javascript",
  "difficultyLevel": "medium"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "title": "Introducción a React",
        "content": "<h2>React Basics</h2><p>...</p>",
        "quizQuestions": [...],
        "codeExercises": [...]
      }
    ]
  }
}
```

### **Generar desde Texto**
```http
POST /api/generate-from-text
```

**Body:**
```json
{
  "text": "Contenido textual para generar curso...",
  "contentType": "all",
  "numberOfLessons": 2,
  "generateAdvancedContent": true
}
```

---

## 📊 Analytics (`/api/analytics`)

### **Dashboard del Estudiante**
```http
GET /api/analytics/student/dashboard
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalCourses": 5,
    "completedCourses": 2,
    "totalLessons": 45,
    "completedLessons": 23,
    "totalTimeSpent": 1440,
    "currentStreak": 7,
    "achievements": [
      {
        "id": "first_course",
        "name": "Primer Curso Completado",
        "earnedAt": "2024-01-10T10:00:00.000Z"
      }
    ],
    "recentActivity": [
      {
        "type": "lesson_completed",
        "lessonTitle": "Introducción a Solana",
        "courseTitle": "Desarrollo Blockchain",
        "timestamp": "2024-01-15T09:30:00.000Z"
      }
    ]
  }
}
```

### **Métricas del Instructor**
```http
GET /api/analytics/instructor/courses
```

**Headers:**
```http
x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm
```

---

## 🔄 Webhooks y Eventos

### **Registrar Webhook**
```http
POST /api/webhooks
```

**Body:**
```json
{
  "url": "https://tu-app.com/webhook",
  "events": ["course.created", "lesson.completed", "user.enrolled"],
  "secret": "tu-secreto-webhook"
}
```

### **Eventos Disponibles**
- `course.created` - Curso creado
- `course.updated` - Curso actualizado
- `lesson.completed` - Lección completada
- `user.enrolled` - Usuario inscrito en curso
- `quiz.completed` - Quiz completado

---

## 🚨 Códigos de Error

| Código | Descripción |
|--------|-------------|
| `400` | Bad Request - Parámetros inválidos |
| `401` | Unauthorized - Wallet no autenticada |
| `403` | Forbidden - Sin permisos suficientes |
| `404` | Not Found - Recurso no encontrado |
| `409` | Conflict - Recurso ya existe |
| `422` | Unprocessable Entity - Datos inválidos |
| `429` | Too Many Requests - Rate limit excedido |
| `500` | Internal Server Error - Error del servidor |

### **Ejemplos de Errores**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wallet address required",
    "details": {
      "header": "x-wallet-address"
    }
  }
}
```

**422 Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid course data",
    "details": {
      "fields": {
        "title": "Title is required",
        "price": "Price must be a positive number"
      }
    }
  }
}
```

## 📈 Rate Limiting

La API implementa rate limiting para proteger el servicio:

- **General**: 100 requests por 15 minutos por IP
- **Generación de IA**: 10 requests por hora por wallet
- **Upload de archivos**: 5 requests por minuto por wallet

Headers de respuesta:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

## 🧪 Testing de la API

### **Usando cURL**
```bash
# Health check
curl http://localhost:5000/api/health

# Obtener cursos públicos
curl http://localhost:5000/api/courses/public

# Crear curso (requiere autenticación)
curl -X POST http://localhost:5000/api/courses \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgHkm" \
  -d '{"title":"Mi Curso","description":"Descripción"}'
```

### **Usando Postman**
1. Importar la [colección de Postman](../assets/postman-collection.json)
2. Configurar variables de entorno
3. Ejecutar requests de prueba

### **SDK de JavaScript**
```javascript
import { PlataformaAPI } from '@plataforma-educativa/sdk';

const api = new PlataformaAPI({
  baseURL: 'http://localhost:5000/api',
  walletAddress: 'tu-wallet-address'
});

// Obtener cursos
const courses = await api.courses.list();

// Crear curso
const newCourse = await api.courses.create({
  title: 'Mi Curso',
  description: 'Descripción del curso'
});
```

---

## 📞 Soporte

¿Problemas con la API?

- 📖 **Ejemplos completos**: [Ver repositorio de ejemplos](https://github.com/tu-usuario/plataforma-educativa-examples)
- 🐛 **Reportar bug**: [GitHub Issues](https://github.com/tu-usuario/plataforma-educativa/issues)
- 💬 **Discord**: [Canal #api-support](https://discord.gg/plataforma-educativa)
- 📧 **Email**: api-support@plataforma-educativa.com

---

**Próxima lectura**: [🏗️ Arquitectura del Sistema](../architecture/README.md) 
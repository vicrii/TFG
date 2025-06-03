# Esquema de Base de Datos (MongoDB - Mongoose)

Este documento describe el esquema propuesto para la base de datos NoSQL (MongoDB) utilizada en este proyecto, gestionada a través de Mongoose.

## Tablas

### 1. `Users`

Almacena la información de los usuarios de la plataforma.

*   `_id`: ObjectId (Generado automáticamente, Clave Primaria)
*   `walletAddress`: String (Identificador principal único, Indexado)
*   `displayName`: String (Nombre para mostrar)
*   `email`: String (Correo electrónico único)
*   `bio`: String (Opcional: Biografía del usuario)
*   `role`: String (Enum: 'student', 'instructor', 'admin', 'moderator', Default: 'student')
*   `enrolledCourses`: Array de ObjectId (Ref: `Courses`)
*   `createdCourses`: Array de ObjectId (Ref: `Courses`)
*   `createdAt`: Date (Timestamp de creación)
*   `updatedAt`: Date (Timestamp de última actualización)

### 2. `Courses`

Representa los cursos ofrecidos en la plataforma.

*   `_id`: ObjectId (Clave Primaria)
*   `title`: String (Título del curso)
*   `description`: String (Descripción detallada)
*   `instructor`: ObjectId (Ref: `Users` - El creador/instructor del curso)
*   `modules`: Array de ObjectId (Ref: `Modules` - Los módulos que componen el curso)
*   `price`: Number (Precio, Default: 0)
*   `category`: String (Opcional: Categoría del curso)
*   `published`: Boolean (Indica si el curso está visible/accesible, Default: `false`)
*   `createdAt`: Date
*   `updatedAt`: Date

### 3. `Modules`

Define los módulos o secciones dentro de un curso.

*   `_id`: ObjectId (Clave Primaria)
*   `title`: String (Título del módulo)
*   `course`: ObjectId (Ref: `Courses` - Curso al que pertenece)
*   `lessons`: Array de ObjectId (Ref: `Lessons` - Lecciones dentro del módulo)
*   `order`: Number (Define el orden secuencial del módulo dentro del curso)
*   `createdAt`: Date
*   `updatedAt`: Date

### 4. `Lessons`

Contiene las lecciones individuales de cada módulo.

*   `_id`: ObjectId (Clave Primaria)
*   `title`: String (Título de la lección)
*   `module`: ObjectId (Ref: `Modules` - Módulo al que pertenece)
*   `contentType`: String (Enum: 'video', 'text', 'quiz' - Tipo de contenido)
*   `contentUrl`: String (Opcional: URL para contenido 'video' u otros recursos)
*   `contentText`: String (Opcional: Contenido para lecciones tipo 'text')
*   `order`: Number (Define el orden secuencial de la lección dentro del módulo)
*   `duration`: Number (Opcional: Duración estimada en minutos/segundos)
*   `createdAt`: Date
*   `updatedAt`: Date

### 5. `Enrollments`

Gestiona la inscripción de los usuarios en los cursos y su progreso. Actúa como una tabla de unión entre `Users` y `Courses`.

*   `_id`: ObjectId (Clave Primaria)
*   `user`: ObjectId (Ref: `Users` - El usuario inscrito)
*   `course`: ObjectId (Ref: `Courses` - El curso al que se inscribió)
*   `enrollmentDate`: Date (Fecha de inscripción, Default: `Date.now`)
*   `progress`: Array de Objetos (Seguimiento del progreso por lección)
    *   `lessonId`: ObjectId (Ref: `Lessons` - La lección específica)
    *   `completed`: Boolean (Indica si la lección fue completada, Default: `false`)
    *   `completedAt`: Date (Opcional: Timestamp de cuándo se completó la lección)
*   `completed`: Boolean (Indica si el curso completo fue finalizado, Default: `false`)
*   `completionDate`: Date (Opcional: Timestamp de cuándo se finalizó el curso)
*   `createdAt`: Date
*   `updatedAt`: Date

## Relaciones

Las relaciones entre colecciones se manejan principalmente mediante **Referencias**, almacenando los `ObjectId` de los documentos relacionados en los campos correspondientes. Se utilizará `.populate()` (Mongoose) o `$lookup` (MongoDB) en las consultas para recuperar los datos asociados cuando sea necesario.

## Estado Actual del Proyecto

### Backend (`/back`)

**Hecho:**

*   **API de Usuarios:** Rutas básicas (CRUD parcial) en `back/db/server/routes/users.ts` (GET all, GET by wallet, POST create, PUT update).
*   **Modelo `User`:** Modelo Mongoose existente para operaciones de usuario.
*   **Estructura básica:** Servidor Express (`server.ts`), carpetas `models`, `db/server/routes`.

**Pendiente:**

*   **Modelos de Datos:** Crear modelos Mongoose para `Course`, `Module`, `Lesson`, `Enrollment`.
*   **API Completa:** Implementar rutas CRUD completas para Cursos, Módulos, Lecciones e Inscripciones.
*   **Integración de Relaciones:** Actualizar modelos y rutas para usar referencias (`populate`).
*   **Autenticación/Autorización:** Implementar middleware para seguridad y roles.
*   **Configuración DB:** Conexión explícita y configuración de MongoDB.

### Frontend (`/front`)

**Hecho:**

*   **Configuración del Proyecto:** Vite + TypeScript.
*   **Estructura del Código Fuente (`src/`):**
    *   Componente principal (`App.tsx`).
    *   Organización en carpetas: `pages`, `components`, `context`, `hooks`, `services`, `styles`, `utils`, `assets`.
    *   Punto de entrada (`main.tsx`).
*   **Routing:**  configurado en `App.tsx` y usando la carpeta `pages`.
*   **Lógica de API:** Centralizada en `services/`.
*   **Componentes Reutilizables:** Definidos en `components/`.
*   **Hooks Personalizados:** Creados en `hooks/`.

**Pendiente / Necesita Verificación:**

*   **Integración API Completa:** Asegurar que todas las llamadas necesarias al backend (existentes y futuras) estén implementadas, incluyendo manejo de carga y errores.
*   **Funcionalidad Completa:** Validar que la gestión de estado, la conexión de wallet y otras lógicas funcionen correctamente en toda la aplicación.
*   **Interfaz de Usuario Final:** Completar el diseño y desarrollo de toda la interfaz según los requisitos.
*   **Centralización de variables:** Verificar que las variables de entorno estén correctamente centralizadas en un solo archivo.
*   

## Tecnologías Utilizadas

*   **Backend:**
    *   Node.js
    *   Express.js
    *   TypeScript
    *   MongoDB (Base de Datos NoSQL)
    *   Mongoose
*   **Frontend:**
    *   React 
    *   TypeScript
    *   CSS (con variables y Bootstrap)
    *   Solana Wallet Adapter (para la conexión de wallets)
*   **General:**
    *   Git (Control de versiones)

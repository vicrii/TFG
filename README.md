# 🎓 Plataforma de Aprendizaje Blockchain - Proyecto DAW

<div align="center">

![Proyecto DAW](https://img.shields.io/badge/Proyecto-DAW-blue)
![HTML5](https://img.shields.io/badge/HTML5-✓-orange)
![CSS3](https://img.shields.io/badge/CSS3-✓-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-7+-green)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple)
![Responsive](https://img.shields.io/badge/Responsive-✓-success)

**🌐 [DEMO EN VIVO](https://solanalearn.up.railway.app)** | **📁 [REPOSITORIO](https://github.com/vicrii/TFG)**

</div>

---

## 📋 Información

### 🔌 **Puertos y URLs**

| Servicio | Puerto | URL Local | URL Producción |
|----------|---------|-----------|----------------|
| **Frontend** | 5173 | http://localhost:5173 | https://solanalearn.up.railway.app |
| **Backend API** | 5000 | http://localhost:5000/api | https://solanalearn.up.railway.app/api

### 🚀 **Instrucciones de Uso**

#### **Con Docker (Recomendado)**
```bash
# 1. Clonar repositorio
git clone https://github.com/vicrii/TFG.git
cd TFG

# 2. Ejecutar con Docker
docker-compose up --build

# 3. Acceder: http://localhost:5173
```

#### **Manual**
```bash
# 1. Instalar dependencias
npm run install:all

# 2. Configurar .env
cp back/.env.example back/.env

# 3. Iniciar
npm run dev
```

## 🏗️ Arquitectura MVC

### **Patrón Modelo-Vista-Controlador**

```mermaid
graph TB
    subgraph "VISTA - Frontend React"
        V1[Páginas/Components]
        V2[HTML5 Semántico]
        V3[CSS3 + Bootstrap]
        V4[JavaScript/TypeScript]
    end
    
    subgraph "CONTROLADOR - Backend Express"
        C1[Routes/Endpoints]
        C2[Controllers]
        C3[Middleware]
        C4[Validaciones]
    end
    
    subgraph "MODELO - MongoDB"
        M1[Schemas Mongoose]
        M2[Base de Datos]
        M3[Relaciones]
    end
    
    V1 <--> C1
    V2 <--> C2
    V3 <--> C3
    V4 <--> C4
    
    C1 --> M1
    C2 --> M2
    C3 --> M1
    M1 --> M2
```

### **Descripción de Capas**

#### **🎨 VISTA (Frontend)**
- **React 19**: Framework principal para interfaces dinámicas
- **TypeScript**: Tipado estático para mejor desarrollo
- **Bootstrap 5**: Framework CSS para responsive design
- **HTML5 semántico**: Estructura accesible
- **CSS3 moderno**: Animations, Grid, Flexbox, Custom Properties

#### **🎮 CONTROLADOR (Backend)**
- **Express.js**: Framework web para Node.js
- **REST API**: Endpoints estructurados siguiendo estándares
- **Middleware personalizado**: Autenticación, validación, CORS
- **Gestión de usuarios**: Sistema de login y permisos

#### **💾 MODELO (Datos)**
- **MongoDB**: Base de datos NoSQL para flexibilidad
- **Mongoose**: ODM para modelado de datos y relaciones
- **Schemas estructurados**: Validación y consistencia de datos

---

## 👥 Tipos de Usuarios y Operaciones

| Rol | Operaciones | Acceso |
|-----|-------------|--------|
| **👑 Admin** | • CRUD usuarios<br>• Gestión completa cursos<br>• Analytics globales<br>• Configuración sistema | Total |
| **👨‍🏫 Instructor** | • Crear/editar cursos<br>• Gestionar estudiantes<br>• Ver analytics propios | Cursos propios |
| **👨‍🎓 Estudiante** | • Ver cursos<br>• Completar lecciones<br>• Realizar evaluaciones | Cursos inscritos |

### **🔄 Flujos de Usuario Principales**

#### **Estudiante**
1. **Registro/Login** → Autenticación web o wallet
2. **Explorar Cursos** → Catálogo con filtros
3. **Inscribirse** → Proceso de matrícula
4. **Estudiar** → Lecciones, videos, ejercicios
5. **Evaluar** → Quizzes y proyectos
6. **Certificar** → Completar curso

#### **Instructor**
1. **Login** → Panel de instructor
2. **Crear Curso** → Editor avanzado
3. **Gestionar Contenido** → Lecciones, evaluaciones
4. **Monitorear** → Analytics y progreso

---

## 🗺️ Mapa de Navegación

```
🏠 HOME (/)
├── 📚 CURSOS (/courses)
│   ├── 🔍 Explorar (/courses/explore)
│   ├── 📋 Mi Aprendizaje (/my-courses)
│   └── 📖 Curso (/course/:id)
│       ├── 📄 Información
│       └── 📝 Lecciones (/course/:id/lesson/:number)
│
├── 👤 PERFIL (/profile)
│
├── 👨‍🏫 INSTRUCTOR (/instructor) [Instructor+]
│   ├── 📊 Dashboard
│   ├── ➕ Crear Curso
│   └── 📚 Mis Cursos
│
├── 🛠️ ADMIN (/admin) [Admin]
│   ├── 👥 Usuarios
│   ├── 📚 Cursos
│   └── 📊 Analytics
│
└── 🔐 LOGIN (/login)
```



## 🗃️ Diseño de Base de Datos

### **Diagrama E-R Simplificado**

```mermaid
erDiagram
    USERS ||--o{ ENROLLMENTS : "se inscribe"
    USERS ||--o{ COURSES : "crea"
    COURSES ||--o{ LESSONS : "contiene"
    COURSES ||--o{ ENROLLMENTS : "tiene"
    LESSONS ||--o{ USER_PROGRESS : "registra"

    USERS {
        ObjectId _id PK
        String email UK
        String displayName
        String role
        Date createdAt
    }

    COURSES {
        ObjectId _id PK
        String title
        String description
        ObjectId instructor FK
        Boolean published
        Date createdAt
    }

    LESSONS {
        ObjectId _id PK
        String title
        String content
        ObjectId course FK
        Number order
        Array quizQuestions
    }

    ENROLLMENTS {
        ObjectId _id PK
        ObjectId user FK
        ObjectId course FK
        Number progress
        Boolean completed
    }
```

### **Paso a Tablas (Colecciones MongoDB)**

#### **1. Colección: `users`**
```javascript
{
  _id: ObjectId,
  email: String, // único
  displayName: String,
  role: String, // 'admin', 'instructor', 'student'
  walletAddress: String,
  createdAt: Date,
  
  // Índices
  indexes: [
    { email: 1 }, // único
    { walletAddress: 1 },
    { role: 1 }
  ]
}
```

#### **2. Colección: `courses`**
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  instructor: ObjectId, // ref: 'users'
  published: Boolean,
  createdAt: Date,
  
  // Índices
  indexes: [
    { instructor: 1 },
    { published: 1 },
    { createdAt: -1 }
  ]
}
```

#### **3. Colección: `lessons`**
```javascript
{
  _id: ObjectId,
  title: String,
  content: String, // HTML
  course: ObjectId, // ref: 'courses'
  order: Number,
  videoUrl: String,
  quizQuestions: [Object],
  
  // Índices
  indexes: [
    { course: 1, order: 1 },
    { course: 1 }
  ]
}
```

---

## 💻 Descripción de la Plataforma

### **🎨 Diseño de Interfaces**

#### **✅ HTML5 y CSS3**
- **HTML5 semántico**: `<header>`, `<nav>`, `<main>`, `<section>`
- **CSS3**: Flexbox, Grid, Animations, Custom Properties
- **Progressive Enhancement**: Funcionalidad básica sin JavaScript

#### **✅ Multimedia**
- **Videos integrados**: Reproductor personalizado con controles
- **Imágenes optimizadas**: WebP, lazy loading, responsive images
- **SVG**: Iconos escalables y animaciones

#### **✅ React Framework**
**Justificación de Elección:**
- **Componentización**: Reutilización y mantenibilidad
- **Virtual DOM**: Rendimiento optimizado
- **Ecosistema**: Abundantes librerías y herramientas
- **TypeScript**: Tipado estático para mejor desarrollo
- **Hooks**: Gestión moderna de estado





### **🔒 Servidor y Administración**

#### **✅ Servidor Online**
- **Railway**: Hosting en la nube

---

## 🛠️ Stack Tecnológico

### **Frontend**
- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos + animaciones
- **React 19**: Framework interactivo
- **TypeScript**: Tipado estático
- **Bootstrap 5**: Framework responsive
- **Vite**: Build tool rápido

### **Backend**
- **Node.js 20**: Runtime JavaScript
- **Express.js**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB

### **DevOps**
- **Docker**: Containerización
- **Railway**: Hosting cloud
- **Nginx**: Servidor web
- **GitHub**: Control de versiones

---

## 📁 Estructura del Proyecto

```
📦 TFG/
├── 📂 front/                 # Frontend (VISTA)
│   ├── 📂 public/
│   │   └── index.html        # HTML5 principal
│   ├── 📂 src/
│   │   ├── 📂 components/    # Componentes React
│   │   ├── 📂 pages/         # Páginas principales
│   │   ├── 📂 services/      # API client
│   │   └── 📂 styles/        # CSS3 + Bootstrap
│   └── package.json
│
├── 📂 back/                  # Backend (CONTROLADOR + MODELO)
│   ├── 📂 src/
│   │   ├── 📂 routes/        # Endpoints API
│   │   ├── 📂 controllers/   # Lógica de negocio
│   │   ├── 📂 models/        # Esquemas MongoDB
│   │   └── 📂 middleware/    # Validaciones
│   ├── server.ts             # Servidor Express
│   └── package.json
│
├── docker-compose.yml        # Orquestación
└── README.md                 # Documentación principal
```

---

## 🚀 Instalación

### **Opción 1: Docker**
```bash
git clone https://github.com/vicrii/TFG.git
cd TFG
docker-compose up --build
```

### **Opción 2: Manual**
```bash
# 1. Clonar
git clone https://github.com/vicrii/TFG.git
cd TFG

# 2. Instalar
npm run install:all

# 3. Configurar
cp back/.env.example back/.env
# Editar variables de entorno

# 4. Ejecutar
npm run dev
```

---

## 🔗 Enlaces Importantes

- **🌐 Demo**: https://solanalearn.up.railway.app
- **📂 Repositorio**: https://github.com/vicrii/TFG

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

<div align="center">

**🎓 Proyecto Final DAW - Desarrollo de Aplicaciones Web**


**[🚀 Demo](https://solanalearn.up.railway.app)**

</div> 
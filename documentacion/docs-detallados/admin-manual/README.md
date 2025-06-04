# 🛠️ Manual de Administración - Proyecto DAW

## 🎯 Introducción

Este manual está dirigido a administradores del sistema que necesitan gestionar la **Plataforma de Aprendizaje Blockchain**. Aquí encontrarás toda la información necesaria para la administración, configuración y mantenimiento de la aplicación web.

### **Responsabilidades del Administrador**
- 🔧 **Configuración del sistema** y parámetros
- 👥 **Gestión de usuarios** y roles
- 📚 **Supervisión de contenido** y cursos
- 📊 **Monitoreo de métricas** y analytics
- 🔒 **Seguridad** y backup de datos
- 🛠️ **Mantenimiento** y actualizaciones

---

## 🚀 Acceso Administrativo

### **🔐 Credenciales de Administrador**

#### **Acceso Principal**
- **Email**: `admin@plataforma.com`
- **Contraseña**: `admin123`
- **Rol**: Administrador completo
- **Permisos**: Acceso total al sistema

#### **Panel de Administración**
1. **Login**: Usar credenciales de administrador
2. **Acceso**: Menú principal → "Panel Admin"
3. **Dashboard**: Vista general del sistema
4. **Navegación**: Menú lateral con todas las opciones

### **🏠 Dashboard Administrativo**

#### **Vista General**
- **Métricas principales**: Usuarios, cursos, actividad
- **Gráficos en tiempo real**: Registros, completados, errores
- **Alertas del sistema**: Problemas y notificaciones
- **Accesos rápidos**: Funciones más utilizadas

#### **Widgets Disponibles**
- **👥 Usuarios activos**: Últimas 24h, 7 días, 30 días
- **📚 Cursos populares**: Más vistos y mejor valorados
- **💻 Recursos del sistema**: CPU, memoria, almacenamiento
- **🔒 Logs de seguridad**: Intentos de acceso, errores

---

## 👥 Gestión de Usuarios

### **📋 Lista de Usuarios**

#### **Acceso y Navegación**
1. **Ruta**: Panel Admin → "Gestión de Usuarios"
2. **Filtros disponibles**:
   - Por rol (Admin, Instructor, Estudiante)
   - Por estado (Activo, Inactivo, Bloqueado)
   - Por fecha de registro
   - Búsqueda por email o nombre

#### **Información de Usuario**
```javascript
{
  id: "ObjectId",
  email: "usuario@email.com",
  displayName: "Nombre Usuario",
  role: "student|instructor|admin|moderator",
  walletAddress: "solana-wallet-address",
  createdAt: "2024-01-15T10:30:00Z",
  lastLogin: "2024-01-20T15:45:00Z",
  isActive: true,
  enrolledCourses: ["courseId1", "courseId2"],
  createdCourses: ["courseId3"] // solo instructores
}
```

### **➕ Crear Usuario**

#### **Formulario de Creación**
1. **Acceso**: Gestión Usuarios → "Nuevo Usuario"
2. **Campos obligatorios**:
   - Email (único en el sistema)
   - Nombre para mostrar
   - Rol inicial
   - Contraseña temporal
3. **Campos opcionales**:
   - Biografía
   - Wallet address
   - Avatar/foto de perfil

#### **Asignación de Roles**
- **👑 Administrador**: Acceso completo al sistema
- **👨‍🏫 Instructor**: Crear y gestionar cursos
- **🛡️ Moderador**: Moderar contenido y usuarios
- **👨‍🎓 Estudiante**: Acceso estándar a cursos

### **✏️ Editar Usuario**

#### **Información Editable**
- **Datos personales**: Nombre, email, biografía
- **Rol y permisos**: Cambiar nivel de acceso
- **Estado de cuenta**: Activar/desactivar/bloquear
- **Configuraciones**: Preferencias y settings

#### **Acciones Administrativas**
```typescript
// Cambiar rol de usuario
PUT /api/admin/users/:id/role
{
  "newRole": "instructor",
  "reason": "Promoción a instructor"
}

// Suspender usuario
PUT /api/admin/users/:id/suspend
{
  "suspended": true,
  "reason": "Violación de términos",
  "duration": "7d" // 7 días
}
```

### **🗑️ Eliminar Usuario**

#### **Proceso de Eliminación**
1. **Soft Delete**: Marcar como eliminado (recomendado)
2. **Hard Delete**: Eliminación completa (cuidado con GDPR)
3. **Confirmación**: Requiere confirmación explícita
4. **Backup**: Automático antes de eliminación

#### **Consideraciones Legales**
- **GDPR**: Derecho al olvido en Europa
- **Backup**: Mantener logs por auditoria
- **Notificación**: Informar al usuario si es requerido

---

## 📚 Gestión de Cursos

### **📋 Lista de Cursos**

#### **Vista Administrativa**
1. **Acceso**: Panel Admin → "Gestión de Cursos"
2. **Información mostrada**:
   - Título y descripción
   - Instructor creador
   - Estado (Borrador, Publicado, Archivado)
   - Estudiantes inscritos
   - Fecha de creación/actualización

#### **Filtros y Búsqueda**
- **Por estado**: Publicados, borradores, archivados
- **Por instructor**: Cursos de un instructor específico
- **Por categoría**: Blockchain, Web3, DeFi, etc.
- **Por popularidad**: Más/menos inscritos
- **Por fecha**: Recientes, antiguos

### **✅ Aprobar/Rechazar Cursos**

#### **Proceso de Moderación**
1. **Revisión de contenido**: Verificar calidad y adecuación
2. **Validación técnica**: Comprobar ejercicios y evaluaciones
3. **Cumplimiento**: Verificar términos y políticas
4. **Decisión**: Aprobar, rechazar o solicitar cambios

#### **Estados de Curso**
```typescript
enum CourseStatus {
  DRAFT = "draft",           // Borrador del instructor
  PENDING = "pending",       // Pendiente de revisión
  APPROVED = "approved",     // Aprobado para publicación
  PUBLISHED = "published",   // Publicado y visible
  REJECTED = "rejected",     // Rechazado
  ARCHIVED = "archived"      // Archivado
}
```

### **📝 Editar Contenido**

#### **Permisos de Edición**
- **Administrador**: Puede editar cualquier curso
- **Datos editables**: Título, descripción, categoría, precio
- **Contenido**: Lecciones, videos, ejercicios, evaluaciones
- **Configuración**: Requisitos, dificultad, duración

#### **Versionado**
- **Control de cambios**: Log de todas las modificaciones
- **Versiones**: Mantener historial de versiones
- **Rollback**: Posibilidad de revertir cambios
- **Notificaciones**: Informar cambios al instructor

---

## 📊 Analytics y Métricas

### **📈 Dashboard de Métricas**

#### **Métricas de Usuario**
```typescript
interface UserMetrics {
  totalUsers: number;
  activeUsers: number;          // Últimos 30 días
  newRegistrations: number;     // Este mes
  usersByRole: {
    students: number;
    instructors: number;
    admins: number;
  };
  retention: {
    daily: number;    // % usuarios que vuelven diariamente
    weekly: number;   // % usuarios que vuelven semanalmente
    monthly: number;  // % usuarios que vuelven mensualmente
  };
}
```

#### **Métricas de Contenido**
```typescript
interface ContentMetrics {
  totalCourses: number;
  publishedCourses: number;
  totalLessons: number;
  totalCompletions: number;
  averageRating: number;
  topCourses: Course[];         // Más populares
  categoryDistribution: {
    category: string;
    count: number;
  }[];
}
```

#### **Métricas de Sistema**
```typescript
interface SystemMetrics {
  uptime: number;               // % tiempo online
  responseTime: number;         // ms promedio
  errorRate: number;            // % requests con error
  apiCalls: number;             // Total llamadas API
  storage: {
    used: number;               // GB utilizados
    available: number;          // GB disponibles
    videos: number;             // GB en videos
    images: number;             // GB en imágenes
  };
}
```

### **📊 Reportes y Exports**

#### **Reportes Disponibles**
1. **Reporte de Usuarios**: CSV con todos los usuarios
2. **Reporte de Cursos**: Estadísticas por curso
3. **Reporte de Actividad**: Log de actividades por período
4. **Reporte Financiero**: Ingresos y suscripciones (si aplica)

#### **Formatos de Export**
- **CSV**: Para análisis en Excel/Google Sheets
- **JSON**: Para integración con otras herramientas
- **PDF**: Reportes ejecutivos formateados
- **API**: Endpoints para integraciones

---

## 🔧 Configuración del Sistema

### **⚙️ Parámetros Generales**

#### **Configuración de la Aplicación**
```typescript
interface AppConfig {
  siteName: string;             // "Plataforma de Aprendizaje"
  description: string;          // Meta descripción
  logoUrl: string;              // URL del logo
  faviconUrl: string;           // URL del favicon
  supportEmail: string;         // Email de soporte
  maxFileSize: number;          // MB máximo para uploads
  allowedFileTypes: string[];   // Tipos de archivo permitidos
  defaultLanguage: string;      // Idioma por defecto
  timezone: string;             // Zona horaria
}
```

#### **Configuración de Cursos**
```typescript
interface CourseConfig {
  maxLessonsPerCourse: number;  // Límite de lecciones
  maxVideoDuration: number;     // Minutos máximo por video
  minQuizQuestions: number;     // Mínimo preguntas en quiz
  passingScore: number;         // % mínimo para aprobar
  certificateTemplate: string;  // Plantilla de certificados
  autoApprove: boolean;         // Auto-aprobar cursos nuevos
}
```

### **🔐 Configuración de Seguridad**

#### **Autenticación**
```typescript
interface AuthConfig {
  jwtSecret: string;            // Secreto para JWT
  jwtExpiry: string;            // Tiempo expiración (24h)
  passwordMinLength: number;    // Longitud mínima contraseña
  maxLoginAttempts: number;     // Intentos antes de bloqueo
  lockoutDuration: number;      // Minutos de bloqueo
  requireEmailVerification: boolean;
  allowWalletAuth: boolean;     // Permitir auth con wallet
}
```

#### **Rate Limiting**
```typescript
interface RateLimitConfig {
  apiCalls: {
    windowMs: number;           // Ventana tiempo (15 min)
    max: number;                // Máximo requests por ventana
  };
  auth: {
    windowMs: number;           // Ventana para auth (15 min)
    max: number;                // Intentos login por ventana
  };
  uploads: {
    windowMs: number;           // Ventana uploads (1 hora)
    max: number;                // Máximo uploads por ventana
  };
}
```

### **📧 Configuración de Email**

#### **SMTP Settings**
```typescript
interface EmailConfig {
  provider: "smtp" | "sendgrid" | "mailgun";
  smtp: {
    host: string;               // servidor SMTP
    port: number;               // puerto (587, 465)
    secure: boolean;            // SSL/TLS
    user: string;               // usuario SMTP
    password: string;           // contraseña SMTP
  };
  from: {
    name: string;               // Nombre remitente
    email: string;              // Email remitente
  };
  templates: {
    welcome: string;            // Template email bienvenida
    resetPassword: string;      // Template reset contraseña
    courseComplete: string;     // Template curso completado
  };
}
```

---

## 🛡️ Seguridad y Mantenimiento

### **🔒 Gestión de Seguridad**

#### **Monitoreo de Seguridad**
1. **Logs de acceso**: Todos los logins y intentos fallidos
2. **Actividad sospechosa**: Múltiples IPs, intentos brute force
3. **Cambios críticos**: Modificaciones a usuarios admin
4. **Acceso a datos**: Queries a información sensible

#### **Backups Automáticos**
```bash
# Configuración de backup diario
# Base de datos
mongodump --db plataforma_educativa --out /backup/daily/$(date +%Y%m%d)

# Archivos subidos
tar -czf /backup/uploads/uploads_$(date +%Y%m%d).tar.gz /app/uploads

# Configuración
cp -r /app/config /backup/config/config_$(date +%Y%m%d)
```

#### **Certificados SSL**
```bash
# Verificar expiración certificados
openssl x509 -in /etc/ssl/certs/certificate.crt -noout -dates

# Renovación automática con Let's Encrypt
certbot renew --quiet --post-hook "systemctl reload nginx"
```

### **🔧 Mantenimiento Rutinario**

#### **Tareas Diarias**
- [ ] Verificar logs de error
- [ ] Comprobar espacio en disco
- [ ] Revisar métricas de rendimiento
- [ ] Validar backups automáticos

#### **Tareas Semanales**
- [ ] Analizar métricas de usuarios
- [ ] Revisar contenido reportado
- [ ] Actualizar dependencias de seguridad
- [ ] Limpiar archivos temporales

#### **Tareas Mensuales**
- [ ] Reporte completo de analytics
- [ ] Revisar y optimizar base de datos
- [ ] Actualizar documentación
- [ ] Planificar actualizaciones

### **📊 Monitoreo del Sistema**

#### **Herramientas de Monitoreo**
```typescript
// Endpoints de health check
GET /api/health               // Estado general
GET /api/health/database      // Estado MongoDB
GET /api/health/storage       // Espacio disponible
GET /api/health/services      // Servicios externos

// Respuesta típica
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "services": {
    "database": "connected",
    "storage": "ok",
    "external_apis": "ok"
  },
  "metrics": {
    "uptime": 99.9,
    "responseTime": 145,
    "memoryUsage": 68.5
  }
}
```

#### **Alertas Automáticas**
- **CPU > 80%**: Alerta por uso elevado
- **Memoria > 90%**: Alerta por memoria
- **Disco > 85%**: Alerta por espacio
- **Errores > 5%**: Alerta por tasa de error
- **Downtime > 1min**: Alerta por caída

---

## 🔄 Actualizaciones y Deployment

### **🚀 Proceso de Deployment**

#### **Entornos**
1. **Desarrollo**: Para testing interno
2. **Staging**: Pruebas pre-producción
3. **Producción**: Entorno live para usuarios

#### **Pipeline de Deploy**
```bash
# 1. Build del proyecto
npm run build

# 2. Tests automáticos
npm run test

# 3. Deploy a staging
railway deploy --environment staging

# 4. Tests de integración
npm run test:integration

# 5. Deploy a producción
railway deploy --environment production
```

### **📦 Gestión de Versiones**

#### **Versionado Semántico**
- **MAJOR.MINOR.PATCH** (ej: 1.2.3)
- **MAJOR**: Cambios incompatibles
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Bug fixes

#### **Changelog Ejemplo**
```markdown
## [1.2.0] - 2024-01-20

### Added
- Sistema de certificaciones blockchain
- Soporte para múltiples idiomas
- API de analytics mejorada

### Changed
- Interfaz de usuario actualizada
- Optimización de rendimiento

### Fixed
- Corrección en sistema de notificaciones
- Bug en validación de formularios
```

### **🔄 Rollback y Recuperación**

#### **Estrategia de Rollback**
```bash
# 1. Identificar versión anterior estable
railway deployments list

# 2. Rollback a versión específica
railway rollback --deployment deployment-id

# 3. Verificar estado post-rollback
railway status
```

#### **Plan de Recuperación**
1. **Backup reciente**: Último backup válido
2. **Datos críticos**: Usuarios y progreso
3. **Configuración**: Variables y settings
4. **Comunicación**: Notificar a usuarios si es necesario

---

## 📞 Soporte y Troubleshooting

### **🆘 Problemas Comunes**

#### **Base de Datos**
```bash
# Error de conexión MongoDB
# 1. Verificar estado del servicio
systemctl status mongod

# 2. Revisar logs
tail -f /var/log/mongodb/mongod.log

# 3. Verificar conexión
mongo --eval "db.adminCommand('ismaster')"
```

#### **Rendimiento Lento**
```bash
# 1. Verificar uso de CPU/memoria
top
htop

# 2. Revisar procesos Node.js
pm2 status
pm2 logs

# 3. Analizar queries lentas MongoDB
db.setProfilingLevel(2, { slowms: 1000 })
db.system.profile.find().sort({ts: -1}).limit(5)
```

#### **Errores de Aplicación**
```bash
# 1. Logs del backend
tail -f logs/application.log

# 2. Logs de Nginx
tail -f /var/log/nginx/error.log

# 3. Logs del sistema
journalctl -u application-service -f
```

### **📧 Canales de Soporte**

#### **Contacto de Emergencia**
- **Email**: admin@plataforma-educativa.com
- **Teléfono**: +34 XXX XXX XXX (horario 24/7)
- **Slack**: Canal #emergencias
- **GitHub**: Issues críticos

#### **Documentación Técnica**
- **Wiki interna**: Procedimientos detallados
- **API Docs**: Documentación de endpoints
- **Runbooks**: Guías paso a paso
- **Knowledge Base**: Soluciones conocidas

---

## 📋 Checklist de Administrador

### **✅ Checklist Diario**
- [ ] Revisar dashboard de métricas
- [ ] Verificar logs de error
- [ ] Comprobar estado de servicios
- [ ] Validar backups automáticos
- [ ] Revisar alertas de seguridad

### **✅ Checklist Semanal**
- [ ] Analizar métricas de usuarios
- [ ] Revisar contenido nuevo
- [ ] Actualizar dependencias
- [ ] Limpiar archivos temporales
- [ ] Revisar reportes de usuarios

### **✅ Checklist Mensual**
- [ ] Reporte completo de analytics
- [ ] Optimización de base de datos
- [ ] Actualización de documentación
- [ ] Revisión de seguridad
- [ ] Planificación de nuevas features

---

*Administración exitosa de la plataforma 🚀* 
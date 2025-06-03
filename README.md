# Plataforma de Aprendizaje Blockchain

## Descripción General
Esta es una plataforma de aprendizaje integrada con blockchain, construida con tecnologías web modernas. El sistema permite la creación y gestión de cursos educativos con integración de pagos en blockchain y seguimiento del progreso de los estudiantes.

## Características Principales
- Autenticación mediante wallet blockchain
- Gestión de cursos y lecciones
- Sistema de pagos integrado con blockchain
- Seguimiento de progreso de estudiantes
- Editor de código integrado
- Sistema de preguntas y evaluaciones
- Personalización de interfaz de usuario
- Notificaciones y preferencias de privacidad

## Stack Tecnológico

### Frontend
- React 19
- TypeScript
- Vite
- Bootstrap 5
- React Router DOM
- Monaco Editor para código
- Integración con Solana
- Chart.js para visualización de datos

### Backend
- Node.js
- Express.js
- TypeScript
- MongoDB con Mongoose
- Integración con IA Generativa de Google
- Procesamiento de audio
- Integración con YouTube

## Estructura del Proyecto

### Backend
```
back/
├── models/          # Modelos de MongoDB
├── src/            # Código fuente
├── scripts/        # Scripts de utilidad
├── db/             # Configuración de base de datos
├── temp/           # Archivos temporales
└── server.ts       # Punto de entrada principal
```

### Frontend
```
front/
├── src/            # Código fuente React
├── public/         # Archivos estáticos
└── index.html      # Punto de entrada HTML
```

## Modelos de Base de Datos

### Usuario
- Wallet Address (único)
- Nombre de usuario
- Email
- Biografía
- Rol (estudiante/instructor/admin/moderador)
- Configuraciones de usuario
- Preferencias de notificación
- Configuraciones de privacidad
- Preferencias de UI

### Curso
- Título
- Descripción
- Contenido
- Imagen
- Instructor (referencia a wallet)
- Precio
- Nivel (principiante/intermedio/avanzado)
- Etiquetas
- Estado de publicación
- Duración total
- Número total de lecciones

## Inicio Rápido

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   # Backend
   cd back
   npm install

   # Frontend
   cd ../front
   npm install
   ```

3. Configurar variables de entorno:
   - Crear archivo `.env` en el directorio `back`
   - Configurar variables necesarias

4. Iniciar servidores de desarrollo:
   ```bash
   # Backend
   cd back
   npm run dev

   # Frontend
   cd ../front
   npm run dev
   ```

## Documentación
La documentación completa está organizada en las siguientes secciones:
- [Comenzando](getting-started/README.md)
- [Arquitectura](architecture/README.md)
- [API](api/README.md)
- [Manuales de Usuario](manuals/README.md)

## Licencia
Este proyecto está licenciado bajo los términos especificados en el archivo LICENSE.

## Contacto
- Email: soporte@ejemplo.com
- Discord: [Únete a nuestra comunidad](https://discord.gg/tu-proyecto)
- Twitter: [@tu-proyecto](https://twitter.com/tu-proyecto) 
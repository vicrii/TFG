// Aplicar configuraciones para evitar errores SSL
// require('./fix-ssl-errors');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './db/server/dbConnection';
import { authenticateUser } from './db/server/middleware/auth';

// Importar las nuevas rutas organizadas
import apiRoutes from './src/routes';

// Cargar variables de entorno
dotenv.config();

// Reducir logs excesivos
const ENABLE_DETAILED_LOGS = false;

const app = express();
const port = process.env.PORT || 5000;

// Configurar CORS dinámicamente según el entorno
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://*.railway.app', 'https://*.up.railway.app'] // Railway domains
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://localhost']; // Local development

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, allow Railway domains
      if (origin.includes('.railway.app') || origin.includes('.up.railway.app')) {
        return callback(null, true);
      }
    } else {
      // In development, allow localhost
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para logging mínimo
app.use((req, res, next) => {
  // Solo mostrar logs esenciales
  if (process.env.NODE_ENV === 'development' && ENABLE_DETAILED_LOGS) {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});

// Conectar a MongoDB
connectDB();

// IMPORTANTE: Registrar TODAS las rutas API ANTES del catch-all
// Ruta de health check para verificar conectividad
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Usar las nuevas rutas centralizadas
app.use('/', apiRoutes);

// Solo en producción: servir archivos estáticos del frontend y catch-all handler
if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(process.cwd(), 'public')));
  
  // Catch-all handler: sirve React para todas las rutas no API
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  });
}

// Middleware de manejo de errores simplificado
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Solo mostrar errores críticos en la consola
  console.error('Error crítico:', err.message);
  
  res.status(500).json({
    error: err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`Conexión a MongoDB: ${process.env.MONGODB_URI || 'default'}`);
});
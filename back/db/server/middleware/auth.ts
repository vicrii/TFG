import { Request, Response, NextFunction } from 'express';
import { User } from '../../../models/User'; 

// Configuración para logs
const DEBUG_MODE = false;

declare global {
  namespace Express {
    interface Request {
      user?: InstanceType<typeof User>; 
    }
  }
}

// Función auxiliar para logs condicionales
function debugLog(...args: any[]) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  // Obtener wallet address del header o de las cookies como respaldo
  const walletAddress = req.headers['x-wallet-address'] as string ||  (req.cookies && req.cookies.walletAddress);
  const isAnalyticsRoute = req.originalUrl.includes('/analytics');
  const isChatRoute = req.originalUrl.includes('/chat');
  const isLessonRoute = req.originalUrl.includes('/lessons');
  const requiresAuth = isAnalyticsRoute || isChatRoute || isLessonRoute;

  // Logs mínimos y solo en modo debug
  debugLog('[Auth]', req.method, req.originalUrl, walletAddress ? 'Con wallet' : 'Sin wallet');

  if (!walletAddress) {
    // Si route requiere autenticación y no hay wallet address
    if (requiresAuth) {
      return res.status(401).json({ message: 'Debes estar autenticado para acceder a este recurso' });
    } else {
      // Si no requiere autenticación, continuar sin usuario
      return next(); 
    }
  }

  try {
    // Encuentra el usuario por su dirección de wallet
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      // Si la ruta requiere autenticación, devuelve error
      if (requiresAuth) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }
      
      // Si no requiere autenticación, continuar sin usuario
      return next();
    }
    
    // Asigna el usuario encontrado al objeto de solicitud
    req.user = user; 
    
    // Establecer cookie de autenticación para respaldo
    res.cookie('walletAddress', walletAddress, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
    
    // Continua con la siguiente función middleware
    next();
  } catch (error) {
    // Log de error crítico
    console.error('[Auth] Error de conexión a BD:', error instanceof Error ? error.message : 'Error desconocido');
    return res.status(500).json({ message: 'Error de autenticación' });
  }
};

/**
 * Middleware para verificar si el usuario es moderador
 * Solo permite acceso a rutas protegidas para moderadores
 */
export const isModeratorMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string;
    
    if (!walletAddress) {
      return res.status(401).json({ message: 'No autorizado: Se requiere dirección de wallet' });
    }
    
    const user = await User.findOne({ walletAddress });
    
    if (!user) {
      return res.status(401).json({ message: 'No autorizado: Usuario no encontrado' });
    }
    
    if (user.role !== 'moderator') {
      return res.status(403).json({ message: 'Prohibido: Se requieren privilegios de moderador' });
    }
    
    // Guardar la información del usuario en req.user para uso posterior
    req.user = user;
    next();
  } catch (error) {
    console.error('Error BD (moderador):', error instanceof Error ? error.message : 'Error desconocido');
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}; 
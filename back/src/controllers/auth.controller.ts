import { Request, Response } from 'express';
import { authService, UserData } from '../services/auth/auth.service';

export class AuthController {
  /**
   * Verifica si un usuario existe por su dirección de wallet
   */
  async checkUserExists(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      
      const user = await authService.checkUserExists(walletAddress);
      
      if (!user) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error in checkUserExists controller:', error);
      res.status(500).json({ 
        message: 'Error al verificar si el usuario existe',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      
      // Validaciones básicas
      if (!userData.walletAddress) {
        res.status(400).json({ message: 'La dirección de wallet es obligatoria' });
        return;
      }
      
      if (!userData.displayName) {
        res.status(400).json({ message: 'El nombre es obligatorio' });
        return;
      }
      
      if (!userData.email) {
        res.status(400).json({ message: 'El email es obligatorio' });
        return;
      }
      
      // Registrar el usuario
      const newUser = await authService.registerUser(userData);
      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error in registerUser controller:', error);
      
      // Si es un error conocido (por ejemplo, usuario ya existe)
      if (error instanceof Error && error.message.includes('Ya existe un usuario')) {
        res.status(409).json({ 
          message: error.message 
        });
        return;
      }
      
      res.status(500).json({ 
        message: 'Error al registrar el usuario',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Verifica el estado del backend
   */
  async checkHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await authService.checkHealth();
      res.status(200).json(health);
    } catch (error) {
      console.error('Error in health check:', error);
      res.status(500).json({ status: 'error', error: (error as Error).message });
    }
  }
}

export const authController = new AuthController(); 
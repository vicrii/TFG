import { Request, Response } from 'express';
import { userService, IUserData } from '../services/user/user.service';

export class UserController {
  /**
   * Get all users (requires moderator permissions)
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error in getAllUsers controller:', error);
      res.status(500).json({ 
        message: 'Error fetching users',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener información detallada de un usuario
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const user = await userService.getUserDetails(userId);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error in getUserDetails controller:', error);
      res.status(500).json({ 
        message: 'Error fetching user details',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Obtener usuario por dirección de wallet
   */
  async getUserByWallet(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        res.status(400).json({ message: 'Wallet address is required' });
        return;
      }
      
      const user = await userService.getUserByWallet(walletAddress);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error in getUserByWallet controller:', error);
      res.status(500).json({ 
        message: 'Error fetching user by wallet',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualizar el perfil de un usuario
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const userData = req.body;
      
      // Basic validation
      if (!walletAddress) {
        res.status(400).json({ message: 'Wallet address is required' });
        return;
      }
      
      const updatedUser = await userService.updateUser(walletAddress, userData);
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error in updateUser controller:', error);
      res.status(500).json({ 
        message: 'Error updating user',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualizar el avatar de un usuario
   */
  async updateUserAvatar(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = req.params;
      const { avatarUrl } = req.body;
      
      if (!walletAddress) {
        res.status(400).json({ message: 'Wallet address is required' });
        return;
      }
      
      if (!avatarUrl) {
        res.status(400).json({ message: 'Avatar URL is required' });
        return;
      }
      
      const updatedUser = await userService.updateUserAvatar(walletAddress, avatarUrl);
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error in updateUserAvatar controller:', error);
      res.status(500).json({ 
        message: 'Error updating user avatar',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Actualizar el rol de un usuario (requiere permisos de moderador)
   */
  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      if (!role) {
        res.status(400).json({ message: 'Role is required' });
        return;
      }
      
      const updatedUser = await userService.updateUserRole(userId, role);
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error in updateUserRole controller:', error);
      res.status(500).json({ 
        message: 'Error updating user role',
        error: (error as Error).message 
      });
    }
  }

  /**
   * Cambiar el estado activo de un usuario (requiere permisos de moderador)
   */
  async toggleUserActive(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      
      if (isActive === undefined) {
        res.status(400).json({ message: 'isActive status is required' });
        return;
      }
      
      const updatedUser = await userService.toggleUserActive(userId, isActive);
      
      if (!updatedUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error in toggleUserActive controller:', error);
      res.status(500).json({ 
        message: 'Error toggling user active status',
        error: (error as Error).message 
      });
    }
  }
}

export const userController = new UserController(); 
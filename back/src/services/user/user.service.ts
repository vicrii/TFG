import mongoose from 'mongoose';
import { User, IUser } from '../../../models/User';

// Interfaz para los datos del usuario
export interface IUserData {
  walletAddress: string;
  displayName: string;
  email?: string;
  bio?: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  avatarUrl?: string;
}

// Helper para convertir el documento de Mongoose a IUserData
const convertToIUserData = (doc: any): IUserData => {
  if (!doc) return null as unknown as IUserData;
  
  return {
    walletAddress: doc.walletAddress,
    displayName: doc.displayName,
    email: doc.email,
    bio: doc.bio,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
    isActive: doc.isActive,
    avatarUrl: doc.avatarUrl
  };
};

export class UserService {
  /**
   * Get all users (requires moderator permissions)
   */
  async getAllUsers(): Promise<IUserData[]> {
    try {
      const users = await User.find();
      return users.map(convertToIUserData);
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Get detailed information for a single user
   */
  async getUserDetails(userId: string): Promise<IUserData | null> {
    try {
      const user = await User.findById(userId);
      return user ? convertToIUserData(user) : null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  }

  /**
   * Get user by wallet address
   */
  async getUserByWallet(walletAddress: string): Promise<IUserData | null> {
    try {
      const user = await User.findOne({ walletAddress });
      return user ? convertToIUserData(user) : null;
    } catch (error) {
      console.error('Error fetching user by wallet:', error);
      throw error;
    }
  }

  /**
   * Update a user's profile
   */
  async updateUser(walletAddress: string, userData: Partial<IUserData>): Promise<IUserData | null> {
    try {
      const user = await User.findOne({ walletAddress });
      
      if (!user) {
        return null;
      }
      
      // Update user fields
      if (userData.displayName) user.displayName = userData.displayName;
      if (userData.email) user.email = userData.email;
      if (userData.bio !== undefined) user.bio = userData.bio;
      
      user.updatedAt = new Date();
      
      const updatedUser = await user.save();
      return convertToIUserData(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user avatar
   */
  async updateUserAvatar(walletAddress: string, avatarUrl: string): Promise<IUserData | null> {
    try {
      const user = await User.findOne({ walletAddress });
      
      if (!user) {
        return null;
      }
      
      user.avatarUrl = avatarUrl;
      user.updatedAt = new Date();
      
      const updatedUser = await user.save();
      return convertToIUserData(updatedUser);
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Update a user's role (requires moderator permissions)
   */
  async updateUserRole(userId: string, role: string): Promise<IUserData | null> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }
      
      // Solo asignar si el rol es válido
      if (["student", "instructor", "admin", "moderator"].includes(role)) {
        user.role = role as IUser["role"];
      } else {
        throw new Error(`Rol no válido: ${role}`);
      }
      user.updatedAt = new Date();
      
      const updatedUser = await user.save();
      return convertToIUserData(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status (requires moderator permissions)
   */
  async toggleUserActive(userId: string, isActive: boolean): Promise<IUserData | null> {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        return null;
      }
      
      user.isActive = isActive;
      user.updatedAt = new Date();
      
      const updatedUser = await user.save();
      return convertToIUserData(updatedUser);
    } catch (error) {
      console.error('Error toggling user active status:', error);
      throw error;
    }
  }
}

// Export a service instance
export const userService = new UserService(); 
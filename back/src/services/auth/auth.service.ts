import mongoose from 'mongoose';
import { User, IUser } from '../../../models/User';

// Interface para la respuesta de usuarios
export interface UserData {
  walletAddress: string;
  displayName: string;
  email: string;
  bio?: string;
  role: 'student' | 'instructor' | 'admin' | 'moderator';
  createdAt: string;
  settings?: {
    displayName?: string;
    email?: string;
    profileImage?: string;
    notificationPreferences?: {
      emailNotifications: boolean;
      courseUpdates: boolean;
      examReminders: boolean;
      achievements: boolean;
    };
    privacySettings?: {
      showProgress: boolean;
      showActivity: boolean;
      showAchievements: boolean;
    };
    uiPreferences?: {
      theme: 'light' | 'dark' | 'system';
      fontSize: 'small' | 'medium' | 'large';
      codeEditorTheme: 'vs-dark' | 'light';
    };
  };
}

// Helper para convertir documento de Mongoose a UserData
const convertToUserData = (doc: any): UserData => {
  if (!doc) return null as unknown as UserData;

  return {
    walletAddress: doc.walletAddress,
    displayName: doc.displayName,
    email: doc.email,
    bio: doc.bio,
    role: doc.role,
    createdAt: doc.createdAt.toISOString(),
    settings: doc.settings
  };
};

export class AuthService {
  /**
   * Verifica si un usuario existe por su dirección de wallet
   */
  async checkUserExists(walletAddress: string): Promise<UserData | null> {
    try {
      if (!walletAddress) {
        return null;
      }

      const user = await User.findOne({ walletAddress });
      if (!user) {
        return null;
      }

      return convertToUserData(user);
    } catch (error) {
      console.error('Error checking if user exists:', error);
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario
   */
  async registerUser(userData: {
    walletAddress: string;
    displayName: string;
    email: string;
    bio?: string;
    role?: 'student' | 'instructor' | 'admin' | 'moderator';
  }): Promise<UserData> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({
        $or: [
          { walletAddress: userData.walletAddress },
          { email: userData.email }
        ]
      });

      if (existingUser) {
        if (existingUser.walletAddress === userData.walletAddress) {
          throw new Error('Ya existe un usuario con esta dirección de wallet');
        }
        if (existingUser.email === userData.email) {
          throw new Error('Ya existe un usuario con este correo electrónico');
        }
      }

      // Crear el nuevo usuario
      const newUser = new User({
        ...userData,
        role: userData.role || 'student', // Por defecto, role student
        createdAt: new Date()
      });

      const savedUser = await newUser.save();
      return convertToUserData(savedUser);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Verifica la conexión con el backend
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  }
}

// Exportar una instancia del servicio
export const authService = new AuthService(); 
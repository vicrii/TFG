import { Schema, model, Document } from 'mongoose';

interface UserSettings {
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
}

export interface IUser extends Document {
  walletAddress: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  role: 'student' | 'instructor' | 'admin' | 'moderator';
  settings?: UserSettings;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

const UserSchema = new Schema<IUser>({
  walletAddress: {
    type: String,
    required: [true, 'La dirección de wallet es obligatoria'],
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true
  },
  bio: {
    type: String,
    maxlength: [500, 'La biografía no puede tener más de 500 caracteres']
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin', 'moderator'],
    default: 'student'
  },
  settings: {
    type: {
      displayName: String,
      email: String,
      profileImage: String,
      notificationPreferences: {
        emailNotifications: { type: Boolean, default: true },
        courseUpdates: { type: Boolean, default: true },
        examReminders: { type: Boolean, default: true },
        achievements: { type: Boolean, default: true }
      },
      privacySettings: {
        showProgress: { type: Boolean, default: true },
        showActivity: { type: Boolean, default: true },
        showAchievements: { type: Boolean, default: true }
      },
      uiPreferences: {
        theme: { 
          type: String, 
          enum: ['light', 'dark', 'system'], 
          default: 'system' 
        },
        fontSize: { 
          type: String, 
          enum: ['small', 'medium', 'large'], 
          default: 'medium' 
        },
        codeEditorTheme: { 
          type: String, 
          enum: ['vs-dark', 'light'], 
          default: 'vs-dark' 
        }
      }
    },
    default: {}
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const User = model<IUser>('User', UserSchema);
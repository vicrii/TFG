import { ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';

export interface LoadingSpinnerProps {
  size?: 'sm' | undefined;
  text?: string;
}

export interface LazyLoaderProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: ReactNode;
  props?: Record<string, any>;
  loadingText?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface WalletInfoProps {
  publicKey: PublicKey | null;
  balance: number | null;
  loading: boolean;
  connected: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export interface AppNavbarProps {
  onThemeToggle?: () => void;
  className?: string;
  isDarkMode?: boolean;
  highContrastMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  animationsEnabled?: boolean;
  user?: any;
  connected?: boolean;
}

export interface AppFooterProps {
  className?: string;
}

export interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp?: string;
  role?: 'user' | 'assistant';
  content?: string;
}

export interface FloatingChatProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
  placeholder?: string;
  buttonText?: string;
  maxHeight?: string;
} 
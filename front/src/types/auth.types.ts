export interface RegisterModalProps {
  show: boolean;
  walletAddress: string;
  onSubmit: (userData: any) => Promise<void>;
  onClose: () => void;
}

export interface LoginModalProps {
  show: boolean;
  onClose: () => void;
  onLogin: (walletAddress: string) => Promise<void>;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (walletAddress: string) => Promise<void>;
  logout: () => void;
  register: (userData: UserRegistrationData) => Promise<void>;
}

export interface User {
  walletAddress: string;
  displayName: string;
  email?: string;
  role: 'student' | 'instructor' | 'admin';
}

export interface UserRegistrationData {
  walletAddress: string;
  displayName: string;
  email?: string;
} 
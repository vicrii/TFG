// Reexportar todo desde el módulo de auth.api.ts
export * from './auth.api';

// Import and re-export individual functions from the API
import { authApi } from './auth.api';

// Re-export individual functions for direct import
export const checkUserExists = authApi.checkUserExists;
export const registerUser = authApi.registerUser;
export const checkBackendConnection = authApi.checkBackendConnection;
export const getStoredWalletAddress = authApi.getStoredWalletAddress; 
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface SafeWalletState {
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  wallet: any;
  connect: (() => void) | null;
  disconnect: (() => void) | null;
  error: Error | null;
}

export function useSafeWallet(): SafeWalletState {
  try {
    const wallet = useWallet();
    return {
      publicKey: wallet.publicKey || null,
      connected: wallet.connected || false,
      connecting: wallet.connecting || false,
      disconnecting: wallet.disconnecting || false,
      wallet: wallet.wallet || null,
      connect: wallet.connect || null,
      disconnect: wallet.disconnect || null,
      error: null
    };
  } catch (error) {
    console.warn('[useSafeWallet] Error accessing wallet context:', error);
    
    // Retornar valores seguros por defecto cuando hay error
    return {
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      wallet: null,
      connect: null,
      disconnect: null,
      error: error as Error
    };
  }
} 
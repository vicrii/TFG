import { useState, useEffect } from 'react';
import { useSafeWallet } from './useSafeWallet';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { solanaService, TokenInfo, SolanaTransaction } from '../services/solana/solanaService';

export function useWalletData() {
  const { publicKey, connected } = useSafeWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [transactions, setTransactions] = useState<SolanaTransaction[]>([]);
  const [loading, setLoading] = useState({
    balance: false,
    tokens: false,
    transactions: false
  });

  // Fetch balance
  useEffect(() => {
    async function fetchBalance() {
      if (!publicKey || !connected) return;
      
      try {
        setLoading(prev => ({ ...prev, balance: true }));
        const bal = await connection.getBalance(publicKey);
        setBalance(bal / LAMPORTS_PER_SOL);
      } catch (error) {
        // Error silenciado
        setBalance(null);
      } finally {
        setLoading(prev => ({ ...prev, balance: false }));
      }
    }

    if (connected && publicKey) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [publicKey, connected, connection]);

  // Fetch tokens and transactions
  useEffect(() => {
    async function fetchData() {
      if (!publicKey || !connected) return;
      
      // Tokens
      try {
        setLoading(prev => ({ ...prev, tokens: true }));
        const tokenAccounts = await solanaService.getTokenAccounts(connection, publicKey);
        setTokens(tokenAccounts);
      } catch (error) {
        // Error silenciado
        setTokens([]);
      } finally {
        setLoading(prev => ({ ...prev, tokens: false }));
      }
      
      // Transactions
      try {
        setLoading(prev => ({ ...prev, transactions: true }));
        const txList = await solanaService.getRecentTransactions(connection, publicKey, 1000);
        setTransactions(txList);
      } catch (error) {
        // Error silenciado
        setTransactions([]);
      } finally {
        setLoading(prev => ({ ...prev, transactions: false }));
      }
    }
    
    if (connected && publicKey) {
      fetchData();
    } else {
      setTokens([]);
      setTransactions([]);
    }
  }, [publicKey, connected, connection]);

  return {
    publicKey,
    connected,
    balance,
    tokens,
    transactions,
    loading
  };
}
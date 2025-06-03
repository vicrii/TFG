import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Badge, Alert } from 'react-bootstrap';

export function WalletDiagnostics() {
  const { wallets, wallet, connected, connecting, disconnecting, publicKey } = useWallet();
  const [diagnostics, setDiagnostics] = useState<any[]>([]);

  useEffect(() => {
    const checkWallets = async () => {
      const results = [];
      
      for (const walletAdapter of wallets) {
        try {
          const info = {
            name: walletAdapter.name,
            icon: walletAdapter.icon,
            url: walletAdapter.url,
            readyState: walletAdapter.readyState,
            connecting: walletAdapter.connecting,
            connected: walletAdapter.connected,
            publicKey: walletAdapter.publicKey?.toString(),
            error: null
          };
          
          // Verificar si el wallet está disponible en el navegador
          if (typeof window !== 'undefined') {
            if (walletAdapter.name === 'Phantom') {
              info.available = !!(window as any).phantom?.solana?.isPhantom;
            } else if (walletAdapter.name === 'Solflare') {
              info.available = !!(window as any).solflare?.isSolflare;
            }
          }
          
          results.push(info);
        } catch (error) {
          results.push({
            name: walletAdapter.name,
            error: error.message,
            available: false
          });
        }
      }
      
      setDiagnostics(results);
    };

    checkWallets();
    
    // Verificar cada 5 segundos
    const interval = setInterval(checkWallets, 5000);
    return () => clearInterval(interval);
  }, [wallets]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Solo mostrar en desarrollo
  }

  return (
    <Card className="mt-3 border-info">
      <Card.Header className="bg-info text-white">
        <h6 className="mb-0">🔍 Diagnóstico de Wallets (Solo desarrollo)</h6>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <strong>Estado actual:</strong>
          <ul className="mb-0">
            <li>Conectado: {connected ? '✅' : '❌'}</li>
            <li>Conectando: {connecting ? '🔄' : '❌'}</li>
            <li>Desconectando: {disconnecting ? '🔄' : '❌'}</li>
            <li>Wallet activo: {wallet?.name || 'Ninguno'}</li>
            <li>PublicKey: {publicKey?.toString().substring(0, 20) + '...' || 'Ninguna'}</li>
          </ul>
        </div>

        <h6>Wallets disponibles:</h6>
        {diagnostics.map((diag, index) => (
          <Alert key={index} variant={diag.error ? 'danger' : diag.available ? 'success' : 'warning'}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{diag.name}</strong>
                {diag.available !== undefined && (
                  <Badge bg={diag.available ? 'success' : 'danger'} className="ms-2">
                    {diag.available ? 'Disponible' : 'No disponible'}
                  </Badge>
                )}
                {diag.connected && <Badge bg="primary" className="ms-1">Conectado</Badge>}
              </div>
              <div>
                ReadyState: {diag.readyState}
              </div>
            </div>
            {diag.error && (
              <div className="mt-2 text-danger">
                <small>Error: {diag.error}</small>
              </div>
            )}
          </Alert>
        ))}
      </Card.Body>
    </Card>
  );
}

export default WalletDiagnostics; 
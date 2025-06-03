import { Card, Button } from 'react-bootstrap';
import { PublicKey } from '@solana/web3.js';

interface WalletInfoProps {
  publicKey: PublicKey;
  balance: number | null;
  loading: boolean;
}

function WalletInfo({ publicKey, balance, loading }: WalletInfoProps) {
  return (
    <Card className="wallet-overview-card">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Información de la Wallet</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <h6>Dirección</h6>
          <p className="wallet-address">{publicKey.toString()}</p>
        </div>
        
        <div className="mb-3">
          <h6>Balance SOL</h6>
          {loading ? (
            <div className="loading-spinner-sm"></div>
          ) : (
            <h3 className="sol-balance">
              {balance !== null ? balance.toFixed(4) : "Error"} 
              <small> SOL</small>
            </h3>
          )}
        </div>
        
        <div className="text-center mt-4">
          <Button variant="outline-primary" size="sm" href={`https://explorer.solana.com/address/${publicKey.toString()}`} target="_blank">
            Ver en Solana Explorer
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default WalletInfo;
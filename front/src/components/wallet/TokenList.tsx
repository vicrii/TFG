import { Card, Alert } from 'react-bootstrap';
import { TokenInfo } from '../../services/solana/solanaService';
import LoadingSpinner from '../common/LoadingSpinner';

interface TokenListProps {
  tokens: TokenInfo[];
  loading: boolean;
}

function TokenList({ tokens, loading }: TokenListProps) {
  return (
    <Card className="mt-4">
      <Card.Header className="bg-secondary text-white">
        <h5 className="mb-0">Tokens SPL</h5>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <LoadingSpinner size="sm" text="Cargando tokens..." />
        ) : tokens.length > 0 ? (
          <div className="token-list-bootstrap">
            {tokens.map((token) => (
              <div key={token.mint} className="token-item-bootstrap">
                <div className="token-symbol-bootstrap">
                  {token.tokenSymbol || token.mint.substring(0, 4) + '...'}
                </div>
                <div className="token-amount-bootstrap">
                  {token.decimals 
                    ? (parseInt(token.amount) / Math.pow(10, token.decimals)).toFixed(token.decimals > 4 ? 4 : token.decimals) 
                    : token.amount}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert variant="light">No se encontraron tokens SPL.</Alert>
        )}
      </Card.Body>
    </Card>
  );
}

export default TokenList;


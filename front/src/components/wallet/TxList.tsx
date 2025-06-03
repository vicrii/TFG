import { useState } from 'react';
import { Card, Badge, Button, Alert } from 'react-bootstrap';
import { SolanaTransaction } from '../../services/solana/solanaService';
import LoadingSpinner from '../common/LoadingSpinner';

interface TransactionListProps {
  transactions: SolanaTransaction[];
  loading: boolean;
}

function TxList({ transactions, loading }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 5;
  
  // Pagination logic
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'Fecha desconocida';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card>
      <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Transacciones Recientes</h5>
        <Badge bg="light" text="dark" pill>
          {transactions.length} Transacciones
        </Badge>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <LoadingSpinner text="Cargando transacciones..." />
        ) : transactions.length > 0 ? (
          <>
            <div className="transaction-list-bootstrap">
              {currentTransactions.map((tx) => (
                <div key={tx.signature} className="transaction-item-bootstrap">
                  <div className="tx-type-bootstrap">{tx.type}</div>
                  <div className="tx-date-bootstrap">{formatDate(tx.blockTime)}</div>
                  <div className={`tx-status-bootstrap ${tx.status}`}>
                    {tx.status === 'success' ? 
                      <Badge bg="success">Éxito</Badge> : 
                      <Badge bg="danger">Error</Badge>
                    }
                  </div>
                  <div className="tx-link-bootstrap">
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`} 
                      target="_blank"
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Controles de paginación */}
            <div className="pagination-controls-bootstrap mt-4">
              <Button 
                variant="outline-secondary" 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <span className="mx-3">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button 
                variant="outline-secondary" 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </>
        ) : (
          <Alert variant="light">No se encontraron transacciones recientes.</Alert>
        )}
      </Card.Body>
    </Card>
  );
}

export default TxList;
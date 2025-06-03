import React, { useState, useEffect } from 'react';
import { Card, Form, Button, ListGroup, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaCube, FaLink, FaHashtag, FaClock, FaCoins, FaUserAlt, FaKey } from 'react-icons/fa';
import CryptoJS from 'crypto-js';

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

const BlockchainSimulator: React.FC = () => {
  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState<{
    from: string;
    to: string;
    amount: number;
  }>({
    from: '',
    to: '',
    amount: 0
  });
  const [miningDifficulty, setMiningDifficulty] = useState<number>(2);
  const [isMining, setIsMining] = useState<boolean>(false);
  const [wallets, setWallets] = useState<{[address: string]: number}>({
    'Alice': 100,
    'Bob': 50,
    'Charlie': 75
  });

  // Inicializar blockchain con bloque génesis
  useEffect(() => {
    if (blockchain.length === 0) {
      const genesisBlock = createGenesisBlock();
      setBlockchain([genesisBlock]);
    }
  }, [blockchain.length]);

  // Crear bloque génesis
  const createGenesisBlock = (): Block => {
    const block: Block = {
      index: 0,
      timestamp: new Date().getTime(),
      transactions: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
      difficulty: miningDifficulty
    };
    
    block.hash = calculateHash(block);
    return block;
  };

  // Calcular hash de un bloque
  const calculateHash = (block: Block): string => {
    const { index, timestamp, transactions, previousHash, nonce } = block;
    const blockString = JSON.stringify({ index, timestamp, transactions, previousHash, nonce });
    return CryptoJS.SHA256(blockString).toString();
  };

  // Minar un bloque (encontrar nonce que cumpla con la dificultad)
  const mineBlock = (block: Block): Block => {
    console.log('Minando bloque...');
    const target = Array(block.difficulty + 1).join('0');
    
    while (block.hash.substring(0, block.difficulty) !== target) {
      block.nonce++;
      block.hash = calculateHash(block);
    }
    
    console.log('Bloque minado:', block.hash);
    return block;
  };

  // Crear nueva transacción
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar transacción
    if (!newTransaction.from || !newTransaction.to || newTransaction.amount <= 0) {
      alert('Por favor complete todos los campos correctamente');
      return;
    }
    
    // Verificar fondos suficientes
    if (!wallets[newTransaction.from] || wallets[newTransaction.from] < newTransaction.amount) {
      alert(`La dirección ${newTransaction.from} no tiene fondos suficientes`);
      return;
    }
    
    // Crear nueva transacción
    const transaction: Transaction = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
      from: newTransaction.from,
      to: newTransaction.to,
      amount: newTransaction.amount,
      timestamp: Date.now()
    };
    
    // Actualizar saldos de las carteras
    const updatedWallets = { ...wallets };
    updatedWallets[newTransaction.from] -= newTransaction.amount;
    updatedWallets[newTransaction.to] = (updatedWallets[newTransaction.to] || 0) + newTransaction.amount;
    
    setWallets(updatedWallets);
    setPendingTransactions([...pendingTransactions, transaction]);
    
    // Limpiar formulario
    setNewTransaction({
      from: '',
      to: '',
      amount: 0
    });
  };

  // Minar un nuevo bloque con las transacciones pendientes
  const handleMineBlock = async () => {
    if (pendingTransactions.length === 0) {
      alert('No hay transacciones pendientes para minar');
      return;
    }
    
    setIsMining(true);
    
    try {
      const lastBlock = blockchain[blockchain.length - 1];
      
      const newBlock: Block = {
        index: lastBlock.index + 1,
        timestamp: Date.now(),
        transactions: [...pendingTransactions],
        previousHash: lastBlock.hash,
        hash: '',
        nonce: 0,
        difficulty: miningDifficulty
      };
      
      // Simular tiempo de minado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Minar el bloque (encontrar nonce)
      const minedBlock = mineBlock(newBlock);
      
      // Añadir bloque a la blockchain
      setBlockchain([...blockchain, minedBlock]);
      
      // Limpiar transacciones pendientes
      setPendingTransactions([]);
    } catch (error) {
      console.error('Error al minar bloque:', error);
    } finally {
      setIsMining(false);
    }
  };

  // Verificar integridad de la blockchain
  const isChainValid = (): boolean => {
    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const previousBlock = blockchain[i - 1];
      
      // Verificar hash del bloque actual
      if (currentBlock.hash !== calculateHash(currentBlock)) {
        return false;
      }
      
      // Verificar que el previousHash coincida con el hash del bloque anterior
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    return true;
  };

  // Formatear tiempo
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="blockchain-simulator">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h4 className="mb-0">Simulador de Blockchain</h4>
        </Card.Header>
        
        <Card.Body>
          <Alert variant="info" className="mb-4">
            <p className="mb-0">
              Este simulador te permite entender los fundamentos de la tecnología blockchain. 
              Puedes crear transacciones, minar bloques y ver cómo se mantiene la integridad de la cadena.
            </p>
          </Alert>
          
          <Row>
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <FaCoins className="me-2 text-warning" />
                    <h5 className="mb-0">Saldos de Carteras</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <ListGroup>
                    {Object.entries(wallets).map(([address, balance]) => (
                      <ListGroup.Item key={address} className="d-flex justify-content-between align-items-center">
                        <div>
                          <FaUserAlt className="me-2 text-secondary" />
                          {address}
                        </div>
                        <Badge bg="success" pill>
                          {balance} SOL
                        </Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
              
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <FaKey className="me-2 text-primary" />
                    <h5 className="mb-0">Nueva Transacción</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleAddTransaction}>
                    <Form.Group className="mb-3">
                      <Form.Label>Remitente</Form.Label>
                      <Form.Select 
                        value={newTransaction.from}
                        onChange={(e) => setNewTransaction({...newTransaction, from: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar remitente</option>
                        {Object.entries(wallets).map(([address, balance]) => (
                          <option key={address} value={address}>{address} ({balance} SOL)</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Destinatario</Form.Label>
                      <Form.Select 
                        value={newTransaction.to}
                        onChange={(e) => setNewTransaction({...newTransaction, to: e.target.value})}
                        required
                      >
                        <option value="">Seleccionar destinatario</option>
                        {Object.keys(wallets).map((address) => (
                          address !== newTransaction.from && (
                            <option key={address} value={address}>{address}</option>
                          )
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Cantidad (SOL)</Form.Label>
                      <Form.Control 
                        type="number"
                        min="1"
                        step="0.1"
                        value={newTransaction.amount || ''}
                        onChange={(e) => setNewTransaction({...newTransaction, amount: parseFloat(e.target.value)})}
                        required
                      />
                    </Form.Group>
                    
                    <Button type="submit" variant="primary" className="w-100">
                      Crear Transacción
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
              
              <Card>
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <FaHashtag className="me-2 text-danger" />
                    <h5 className="mb-0">Configuración de Minado</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Dificultad de Minado</Form.Label>
                    <Form.Range 
                      min={1}
                      max={5}
                      value={miningDifficulty}
                      onChange={(e) => setMiningDifficulty(parseInt(e.target.value))}
                    />
                    <div className="d-flex justify-content-between">
                      <small>Fácil</small>
                      <small>Difícil</small>
                    </div>
                    <div className="mt-2 text-center">
                      <Badge bg="primary" pill>
                        {miningDifficulty} {miningDifficulty === 1 ? 'cero' : 'ceros'}
                      </Badge>
                    </div>
                  </Form.Group>
                  
                  <Button 
                    variant="success" 
                    className="w-100" 
                    onClick={handleMineBlock}
                    disabled={isMining || pendingTransactions.length === 0}
                  >
                    {isMining ? 'Minando...' : 'Minar Bloque'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="mb-4">
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    <FaLink className="me-2 text-primary" />
                    <h5 className="mb-0">Estado de la Blockchain</h5>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Alert variant={isChainValid() ? 'success' : 'danger'}>
                    La blockchain {isChainValid() ? 'es válida ✓' : 'NO es válida ✗'}
                  </Alert>
                  
                  <h6 className="mb-3">Transacciones Pendientes</h6>
                  {pendingTransactions.length > 0 ? (
                    <ListGroup className="mb-4">
                      {pendingTransactions.map((tx) => (
                        <ListGroup.Item key={tx.id} className="small">
                          <div className="d-flex justify-content-between">
                            <span>
                              <strong>De:</strong> {tx.from}
                            </span>
                            <span>
                              <FaClock className="me-1" />
                              {formatTime(tx.timestamp)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>
                              <strong>Para:</strong> {tx.to}
                            </span>
                            <Badge bg="success">
                              {tx.amount} SOL
                            </Badge>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <Alert variant="light" className="text-center mb-4">
                      No hay transacciones pendientes
                    </Alert>
                  )}
                  
                  <h6 className="mb-3">Bloques en la Cadena</h6>
                  <div className="blockchain-blocks">
                    {blockchain.map((block, index) => (
                      <Card key={block.hash} className="mb-3">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between">
                          <span>
                            <FaCube className="me-1" /> Bloque #{block.index}
                          </span>
                          <small>
                            <FaClock className="me-1" />
                            {formatTime(block.timestamp)}
                          </small>
                        </Card.Header>
                        <Card.Body className="p-2">
                          <div className="small mb-2">
                            <strong>Hash:</strong>
                            <div className="text-truncate text-monospace bg-light p-1 rounded">
                              {block.hash}
                            </div>
                          </div>
                          
                          {block.index > 0 && (
                            <div className="small mb-2">
                              <strong>Hash anterior:</strong>
                              <div className="text-truncate text-monospace bg-light p-1 rounded">
                                {block.previousHash}
                              </div>
                            </div>
                          )}
                          
                          <div className="small mb-2">
                            <strong>Nonce:</strong> {block.nonce}
                          </div>
                          
                          <div className="small">
                            <strong>Transacciones:</strong> {block.transactions.length}
                          </div>
                          
                          {block.transactions.length > 0 && (
                            <ListGroup className="mt-2">
                              {block.transactions.map((tx) => (
                                <ListGroup.Item key={tx.id} className="p-2 small">
                                  <div>
                                    <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                                      <strong>De:</strong> {tx.from}
                                    </span>
                                    <span className="ms-2">
                                      <strong>Para:</strong> {tx.to}
                                    </span>
                                  </div>
                                  <div className="d-flex justify-content-between">
                                    <small className="text-muted">
                                      ID: {tx.id.substring(0, 8)}...
                                    </small>
                                    <Badge bg="success">
                                      {tx.amount} SOL
                                    </Badge>
                                  </div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BlockchainSimulator; 
import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Row, Col, Alert, Nav, Spinner } from 'react-bootstrap';
import { FaCode, FaPlay, FaUndo, FaSave, FaDownload, FaTerminal } from 'react-icons/fa';
import Editor from '@monaco-editor/react';

interface CodePlaygroundProps {
  initialCode?: string;
  readOnly?: boolean;
  height?: string;
  language?: 'javascript' | 'typescript' | 'solidity';
  theme?: 'vs-dark' | 'light';
  showOutput?: boolean;
  title?: string;
}

// Ejemplos de código para cada lenguaje
const EXAMPLES = {
  javascript: `// Ejemplo de JavaScript: Crear un Token Simple
  
class Token {
  constructor(name, symbol, totalSupply) {
    this.name = name;
    this.symbol = symbol;
    this.totalSupply = totalSupply;
    this.balances = {};
  }
  
  mint(address, amount) {
    if (!this.balances[address]) {
      this.balances[address] = 0;
    }
    this.balances[address] += amount;
    this.totalSupply += amount;
    console.log(\`Minted \${amount} \${this.symbol} tokens to \${address}\`);
    return true;
  }
  
  transfer(from, to, amount) {
    if (!this.balances[from] || this.balances[from] < amount) {
      console.log('Insufficient balance');
      return false;
    }
    
    if (!this.balances[to]) {
      this.balances[to] = 0;
    }
    
    this.balances[from] -= amount;
    this.balances[to] += amount;
    
    console.log(\`Transferred \${amount} \${this.symbol} from \${from} to \${to}\`);
    return true;
  }
  
  balanceOf(address) {
    return this.balances[address] || 0;
  }
}

// Crear un nuevo token
const myToken = new Token('Solana Learn Token', 'SLT', 0);

// Acuñar tokens
myToken.mint('Alice', 1000);
myToken.mint('Bob', 500);

// Transferir tokens
myToken.transfer('Alice', 'Bob', 200);

// Verificar balances
console.log(\`Balance de Alice: \${myToken.balanceOf('Alice')} SLT\`);
console.log(\`Balance de Bob: \${myToken.balanceOf('Bob')} SLT\`);`,

  typescript: `// Ejemplo de TypeScript: Implementar un Smart Contract Simple

interface Account {
  balance: number;
  nonce: number;
}

interface Transaction {
  from: string;
  to: string;
  amount: number;
  nonce: number;
  signature: string;
}

class SmartContract {
  private accounts: {[address: string]: Account} = {};
  private owner: string;
  
  constructor(owner: string) {
    this.owner = owner;
    // Inicializar cuenta del propietario
    this.accounts[owner] = { balance: 1000, nonce: 0 };
  }
  
  createAccount(address: string): boolean {
    if (this.accounts[address]) {
      console.log('La cuenta ya existe');
      return false;
    }
    
    this.accounts[address] = { balance: 0, nonce: 0 };
    console.log(\`Cuenta creada para \${address}\`);
    return true;
  }
  
  deposit(address: string, amount: number): boolean {
    if (!this.accounts[address]) {
      console.log('La cuenta no existe');
      return false;
    }
    
    this.accounts[address].balance += amount;
    console.log(\`Depositado \${amount} tokens a \${address}\`);
    return true;
  }
  
  transfer(tx: Transaction): boolean {
    const sender = this.accounts[tx.from];
    
    // Verificar que la cuenta existe
    if (!sender) {
      console.log('La cuenta del remitente no existe');
      return false;
    }
    
    // Verificar balance suficiente
    if (sender.balance < tx.amount) {
      console.log('Balance insuficiente');
      return false;
    }
    
    // Verificar nonce (previene ataques de repetición)
    if (sender.nonce !== tx.nonce) {
      console.log('Nonce inválido');
      return false;
    }
    
    // Verificar firma (simplificado para el ejemplo)
    if (tx.signature !== 'valid') {
      console.log('Firma inválida');
      return false;
    }
    
    // Crear cuenta destino si no existe
    if (!this.accounts[tx.to]) {
      this.createAccount(tx.to);
    }
    
    // Actualizar balances
    sender.balance -= tx.amount;
    this.accounts[tx.to].balance += tx.amount;
    
    // Incrementar nonce
    sender.nonce += 1;
    
    console.log(\`Transferido \${tx.amount} tokens de \${tx.from} a \${tx.to}\`);
    return true;
  }
  
  getBalance(address: string): number {
    if (!this.accounts[address]) {
      return 0;
    }
    return this.accounts[address].balance;
  }
}

// Crear contrato
const contract = new SmartContract('Alice');

// Crear cuentas
contract.createAccount('Bob');
contract.createAccount('Charlie');

// Depositar
contract.deposit('Bob', 500);

// Transferir
const transaction: Transaction = {
  from: 'Alice',
  to: 'Charlie',
  amount: 200,
  nonce: 0,
  signature: 'valid'
};

contract.transfer(transaction);

// Verificar balances
console.log(\`Balance de Alice: \${contract.getBalance('Alice')}\`);
console.log(\`Balance de Bob: \${contract.getBalance('Bob')}\`);
console.log(\`Balance de Charlie: \${contract.getBalance('Charlie')}\`);`,

  solidity: `// Ejemplo de Solana: Programa simple en Rust

// NOTA: Este es un pseudocódigo Rust/Solana para fines educativos
// No se ejecutará realmente en este entorno

/* 
// Este sería el código real en un programa Solana
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

// Declarar el punto de entrada del programa
entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    msg!("Programa simple de Solana: ¡Hola, blockchain!");

    // Obtener iterador de cuentas
    let accounts_iter = &mut accounts.iter();

    // Obtener la cuenta que debe firmar la transacción
    let signer = next_account_info(accounts_iter)?;
    
    // Verificar que el firmante es el propietario esperado
    if !signer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Obtener la cuenta de datos
    let data_account = next_account_info(accounts_iter)?;
    
    // Verificar que la cuenta de datos es propiedad de este programa
    if data_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Procesar la instrucción según el primer byte
    match instruction_data[0] {
        0 => {
            msg!("Instrucción: Inicializar cuenta");
            // Lógica para inicializar cuenta
        },
        1 => {
            msg!("Instrucción: Actualizar valor");
            // Verificar que hay suficientes datos
            if instruction_data.len() < 2 {
                return Err(ProgramError::InvalidInstructionData);
            }
            
            // Obtener el nuevo valor
            let value = instruction_data[1];
            
            // Obtener datos mutables de la cuenta
            let mut data = data_account.try_borrow_mut_data()?;
            
            // Establecer el nuevo valor
            data[0] = value;
            
            msg!("Valor actualizado a: {}", value);
        },
        _ => {
            msg!("Instrucción no reconocida");
            return Err(ProgramError::InvalidInstructionData);
        }
    }
    
    Ok(())
}
*/

// En lugar de ejecutar código Solana real, mostramos un simulador para fines educativos
console.log("Simulación de un programa Solana");

class SolanaSimulator {
  constructor() {
    this.accounts = {};
    this.logs = [];
  }
  
  log(message) {
    console.log(message);
    this.logs.push(message);
  }
  
  createAccount(address, lamports = 1000000000, owner = "program") {
    if (this.accounts[address]) {
      this.log(\`La cuenta \${address} ya existe\`);
      return false;
    }
    
    this.accounts[address] = {
      lamports,
      owner,
      data: new Uint8Array(10).fill(0)
    };
    
    this.log(\`Cuenta creada: \${address} con \${lamports/1000000000} SOL\`);
    return true;
  }
  
  transfer(from, to, lamports) {
    if (!this.accounts[from]) {
      this.log(\`Cuenta origen \${from} no existe\`);
      return false;
    }
    
    if (this.accounts[from].lamports < lamports) {
      this.log(\`Fondos insuficientes en \${from}\`);
      return false;
    }
    
    if (!this.accounts[to]) {
      this.createAccount(to, 0);
    }
    
    this.accounts[from].lamports -= lamports;
    this.accounts[to].lamports += lamports;
    
    this.log(\`Transferido \${lamports/1000000000} SOL de \${from} a \${to}\`);
    return true;
  }
  
  executeProgram(programId, accounts, instructionData) {
    this.log(\`Ejecutando programa \${programId}\`);
    this.log(\`Instrucción: \${instructionData[0]}\`);
    
    switch (instructionData[0]) {
      case 0:
        this.log("Inicializando cuenta de datos");
        accounts[1].data[0] = 0;
        break;
      case 1:
        this.log(\`Actualizando valor a \${instructionData[1]}\`);
        accounts[1].data[0] = instructionData[1];
        break;
      default:
        this.log("Instrucción desconocida");
        return false;
    }
    
    return true;
  }
}

// Crear simulador
const solana = new SolanaSimulator();

// Crear cuentas
solana.createAccount("Alice");
solana.createAccount("Bob");
solana.createAccount("programa", 0, "Sistema");
solana.createAccount("cuenta_datos", 0, "programa");

// Transferir SOL
solana.transfer("Alice", "Bob", 500000000); // 0.5 SOL

// Simular ejecución de programa
const cuentas = [
  solana.accounts["Alice"],
  solana.accounts["cuenta_datos"]
];

solana.executeProgram("programa", cuentas, [0]); // Inicializar
solana.executeProgram("programa", cuentas, [1, 42]); // Actualizar valor

console.log("Estado final de las cuentas:", solana.accounts);`
};

const CodePlayground: React.FC<CodePlaygroundProps> = ({
  initialCode,
  readOnly = false,
  height = '500px',
  language = 'javascript',
  theme = 'vs-dark',
  showOutput = true,
  title = 'Entorno de Código'
}) => {
  const [code, setCode] = useState<string>(initialCode || EXAMPLES[language]);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [editorTheme, setEditorTheme] = useState<string>(theme);
  const outputRef = useRef<HTMLDivElement>(null);

  // Actualizar código cuando cambia el lenguaje
  useEffect(() => {
    if (selectedLanguage !== language) {
      setCode(EXAMPLES[selectedLanguage as keyof typeof EXAMPLES] || '');
    }
  }, [selectedLanguage, language]);

  // Scroll al final del output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Reemplazar console.log para capturar la salida
  const captureConsoleOutput = (code: string): string => {
    return `
      const __originalConsoleLog = console.log;
      const __logs = [];
      
      console.log = function() {
        const args = Array.from(arguments);
        __logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '));
        __originalConsoleLog.apply(console, arguments);
      };
      
      try {
        ${code}
      } catch (error) {
        __logs.push('Error: ' + error.message);
        throw error;
      } finally {
        return __logs;
      }
    `;
  };

  // Ejecutar código
  const runCode = async () => {
    setOutput([]);
    setError(null);
    setIsRunning(true);

    try {
      // Solo JavaScript es ejecutable en este entorno
      if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
        const wrappedCode = captureConsoleOutput(code);
        
        // Usar una función para evaluar el código de forma segura
        const executionFunc = new Function(wrappedCode);
        const logs = executionFunc();
        
        setOutput(logs);
      } else {
        // Para Solidity, mostramos un mensaje
        setOutput(['El código Solidity no se puede ejecutar directamente en este entorno.', 
                  'Este es un entorno educativo para explorar la sintaxis y conceptos.']);
      }
    } catch (err: any) {
      console.error('Error al ejecutar código:', err);
      setError(err.message || 'Error desconocido al ejecutar el código');
    } finally {
      setIsRunning(false);
    }
  };

  // Restablecer código al ejemplo por defecto
  const resetCode = () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer el código? Perderás todos tus cambios.')) {
      setCode(EXAMPLES[selectedLanguage as keyof typeof EXAMPLES] || '');
      setOutput([]);
      setError(null);
    }
  };

  // Descargar código
  const downloadCode = () => {
    const extensions: { [key: string]: string } = {
      'javascript': 'js',
      'typescript': 'ts',
      'solidity': 'sol'
    };
    
    const extension = extensions[selectedLanguage] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-playground.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-dark text-white">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <FaCode className="me-2" />
            <h4 className="mb-0">{title}</h4>
          </div>
          
          <div>
            <Button 
              variant="outline-light" 
              size="sm" 
              className="me-2"
              onClick={() => setEditorTheme(editorTheme === 'vs-dark' ? 'light' : 'vs-dark')}
            >
              {editorTheme === 'vs-dark' ? 'Tema Claro' : 'Tema Oscuro'}
            </Button>
          </div>
        </div>
      </Card.Header>
      
      <Card.Body className="p-0">
        <Nav variant="tabs" className="border-bottom">
          <Nav.Item>
            <Nav.Link 
              active={selectedLanguage === 'javascript'} 
              onClick={() => setSelectedLanguage('javascript')}
            >
              JavaScript
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={selectedLanguage === 'typescript'} 
              onClick={() => setSelectedLanguage('typescript')}
            >
              TypeScript
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link 
              active={selectedLanguage === 'solidity'} 
              onClick={() => setSelectedLanguage('solidity')}
            >
              Solana/Rust
            </Nav.Link>
          </Nav.Item>
        </Nav>
        
        <Row className="g-0">
          <Col md={showOutput ? 7 : 12}>
            <div style={{ height }}>
              <Editor
                height="100%"
                defaultLanguage={selectedLanguage === 'solidity' ? 'rust' : selectedLanguage}
                language={selectedLanguage === 'solidity' ? 'rust' : selectedLanguage}
                value={code}
                theme={editorTheme}
                onChange={(value) => setCode(value || '')}
                options={{
                  readOnly,
                  minimap: { enabled: true },
                  fontSize: 14,
                  wordWrap: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            </div>
          </Col>
          
          {showOutput && (
            <Col md={5} className="border-start">
              <div className="d-flex flex-column h-100">
                <div className="bg-dark text-white p-2 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaTerminal className="me-2" />
                    <h6 className="mb-0">Consola</h6>
                  </div>
                  <Button 
                    variant="outline-light" 
                    size="sm"
                    onClick={() => setOutput([])}
                  >
                    Limpiar
                  </Button>
                </div>
                
                <div
                  ref={outputRef}
                  className="p-3 console-output flex-grow-1 overflow-auto"
                  style={{ 
                    backgroundColor: '#1e1e1e', 
                    color: '#d4d4d4',
                    height: 'calc(100% - 40px)',
                    fontFamily: 'Consolas, monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {error && (
                    <div className="text-danger mb-2">
                      {error}
                    </div>
                  )}
                  
                  {output.map((line, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-secondary">{'> '}</span>
                      {line}
                    </div>
                  ))}
                  
                  {isRunning && (
                    <div className="d-flex align-items-center text-info">
                      <Spinner 
                        animation="border" 
                        size="sm" 
                        className="me-2" 
                      />
                      Ejecutando...
                    </div>
                  )}
                </div>
              </div>
            </Col>
          )}
        </Row>
        
        <div className="p-3 border-top bg-light">
          <div className="d-flex justify-content-between">
            <div>
              <Button 
                variant="primary" 
                className="me-2"
                onClick={runCode}
                disabled={isRunning || readOnly}
              >
                <FaPlay className="me-1" /> Ejecutar
              </Button>
              
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={resetCode}
                disabled={readOnly}
              >
                <FaUndo className="me-1" /> Restablecer
              </Button>
            </div>
            
            <div>
              <Button 
                variant="outline-primary"
                onClick={downloadCode}
              >
                <FaDownload className="me-1" /> Descargar
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CodePlayground; 
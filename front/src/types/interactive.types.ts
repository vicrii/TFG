export interface CodePlaygroundProps {
  initialCode?: string;
  readOnly?: boolean;
  height?: string;
  language?: 'javascript' | 'typescript' | 'solidity';
  theme?: 'vs-dark' | 'light';
  showOutput?: boolean;
  title?: string;
}

export interface CodeEditorProps {
  initialCode: string;
  language: string;
  title: string;
  description?: string;
  expectedOutput?: string;
  hint?: string;
  solution?: string;
  readOnly?: boolean;
  height?: number;
  validateCode?: (code: string) => Promise<boolean>;
  theme?: 'vs-dark' | 'light';
  onCodeChange?: (code: string) => void;
  onSuccess?: () => void;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
} 
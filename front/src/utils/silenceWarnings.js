/**
 * Utilidad para silenciar warnings específicos en la consola
 */

// Lista de patrones a silenciar
const suppressPatterns = [
  'RefreshRuntime', 
  'The requested module',
  'Module "buffer" has been externalized',
  'Could not assign Magic Eden provider',
  'StreamMiddleware - Unknown response',
  'Phantom was registered as a Standard Wallet',
  'An error occurred in the <Link> component',
  'react-router-dom.js',
  'Cannot destructure property',
  '404 (Not Found)',
  'useContext(...)',
  'Request timed out after 15000ms',
  'timeout',
  'timed out'
];

// Función helper para convertir argumentos a string de manera segura
function safeArgsToString(args) {
  return args.map(arg => {
    try {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (typeof arg === 'function') return '[Function]';
      if (typeof arg === 'symbol') return arg.toString();
      if (typeof arg === 'object') {
        try {
          // Try JSON.stringify first
          return JSON.stringify(arg);
        } catch (e) {
          try {
            // If JSON.stringify fails, try toString
            return Object.prototype.toString.call(arg);
          } catch (e2) {
            // If everything fails, return a safe representation
            return '[Object]';
          }
        }
      }
      // Fallback for any other type
      return '[Unknown]';
    } catch (e) {
      return '[Error converting argument]';
    }
  }).join(' ');
}

// Guardar las funciones de consola originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Reemplazar console.error
console.error = function(...args) {
  try {
    // Verificar si el mensaje contiene algún patrón a silenciar
    const message = safeArgsToString(args);
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      // No hacer nada
      return;
    }
    // De lo contrario, pasar a la función original
    originalConsoleError.apply(console, args);
  } catch (e) {
    // Si hay algún error, usar la función original
    originalConsoleError.apply(console, args);
  }
};

// Reemplazar console.warn
console.warn = function(...args) {
  try {
    // Verificar si el mensaje contiene algún patrón a silenciar
    const message = safeArgsToString(args);
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      // No hacer nada
      return;
    }
    // De lo contrario, pasar a la función original
    originalConsoleWarn.apply(console, args);
  } catch (e) {
    // Si hay algún error, usar la función original
    originalConsoleWarn.apply(console, args);
  }
};

// Filtrar también algunos logs
console.log = function(...args) {
  try {
    // Convertir los argumentos a un string para verificar
    const message = safeArgsToString(args);
    
    // Verificar si contiene algún patrón a silenciar
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      return;
    }
    
    // Filtrar mensajes específicos
    if (message.includes('Checking wallet') || 
        message.includes('Wallet address set') ||
        message.includes('GET http://localhost:5000/api/')) {
      return;
    }
    
    // Pasar a la función original
    originalConsoleLog.apply(console, args);
  } catch (e) {
    // Si hay algún error, usar la función original
    originalConsoleLog.apply(console, args);
  }
};

// Exportar una función para instalar este silenciador
export function installConsoleSuppressor() {
  // La instalación ya ocurrió cuando se importó este archivo
  console.log('✓ Console warnings suppressor installed');
}

// Auto-instalar
installConsoleSuppressor(); 
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import RegisterModal from './components/auth/RegisterModal';
import { useAuth } from './hooks/useAuth';
import { Container, Alert, Spinner, Button } from 'react-bootstrap';
import { UIProvider, useUI } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { createLazyComponent } from './components/common/LazyLoader';
import { authService } from './services/auth/authService';
import WalletErrorBoundary from './components/common/WalletErrorBoundary';

// Estilos
import '@solana/wallet-adapter-react-ui/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/App.css';

// Componentes
import AppNavbar from './components/common/AppNavbar';
import AppFooter from './components/common/AppFooter';

// Página de inicio siempre cargada inmediatamente
import HomePage from './pages/home/HomePage';

// Carga perezosa para páginas principales
const CoursesPage = createLazyComponent(() => import('./pages/courses/CoursesPage'));
const CourseDetail = createLazyComponent(() => import('./pages/courses/CourseDetail'));
const LessonDetail = createLazyComponent(() => import('./pages/lessons/LessonDetail'));
const ProfilePage = createLazyComponent(() => import('./pages/user/ProfilePage'));
const MyCoursesPage = createLazyComponent(() => import('./pages/courses/MyCoursesPage'));
const CreateCoursePage = createLazyComponent(() => import('./pages/courses/CreateCoursePage'));
const ModeratorDashboard = createLazyComponent(() => import('./pages/ModeratorDashboard'));
const CoursesList = createLazyComponent(() => import('./pages/courses/CoursesList'));
const UsersList = createLazyComponent(() => import('./pages/user/UsersList'));

// Componente de carga
const LoadingComponent = () => (
  <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
    <div className="text-center">
      <Spinner animation="border" variant="primary" className="mb-3" />
      <p className="text-muted">Cargando contenido...</p>
    </div>
  </Container>
);

// Constantes
const BACKEND_CHECK_INTERVAL = 30000; // 30 segundos

// ProtectedRoute para moderadores/admin
const ProtectedRoute = ({ children, user }: { children: ReactNode; user: any }) => {
  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Componente de rutas
const AppRoutes = ({ user }: { user: any }) => {
  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={
          <Suspense fallback={<LoadingComponent />}>
            <CoursesPage />
          </Suspense>
        } />
        <Route path="/course/:courseId" element={
          <Suspense fallback={<LoadingComponent />}>
            <CourseDetail />
          </Suspense>
        } />
        <Route path="/course/:courseId/lesson/:lessonNumber" element={
          <Suspense fallback={<LoadingComponent />}>
            <LessonDetail />
          </Suspense>
        } />
        
        {/* Rutas de usuario */}
        <Route path="/profile" element={
          <Suspense fallback={<LoadingComponent />}>
            <ProfilePage />
          </Suspense>
        } />
        <Route path="/my-courses" element={
          <Suspense fallback={<LoadingComponent />}>
            <MyCoursesPage />
          </Suspense>
        } />
        
        {/* Rutas de creación y herramientas */}
        <Route path="/create-course" element={
          <Suspense fallback={<LoadingComponent />}>
            <CreateCoursePage />
          </Suspense>
        } />
        
        {/* Rutas de moderadores protegidas */}
        <Route path="/moderator" element={
          <ProtectedRoute user={user}>
            <Suspense fallback={<LoadingComponent />}>
              <ModeratorDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/courses-list" element={
          <ProtectedRoute user={user}>
            <Suspense fallback={<LoadingComponent />}>
              <CoursesList />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/users-list" element={
          <ProtectedRoute user={user}>
            <Suspense fallback={<LoadingComponent />}>
              <UsersList />
            </Suspense>
          </ProtectedRoute>
        } />
        {/* Ruta para redirigir a home si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

// Componente para mejorar accesibilidad - permite saltar al contenido principal
const SkipToContent = () => (
  <a href="#main-content" className="skip-to-content">
    Saltar al contenido principal
  </a>
);

// Componente intermedio que maneja la autenticación y la pasa a UIProvider
function AppWithAuth() {
  const { showRegister, handleRegister, setShowRegister, user, checkUserForWallet, loading } = useAuth();
  
  // Mostrar loading mientras se inicializa la autenticación
  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Inicializando autenticación...</p>
      </div>
    );
  }
  
  return (
    <UIProvider user={user}>
      <AppContent 
        user={user}
        showRegister={showRegister}
        handleRegister={handleRegister}
        setShowRegister={setShowRegister}
        checkUserForWallet={checkUserForWallet}
      />
    </UIProvider>
  );
}

// Componente interno para manejar la aplicación
function AppContent({ 
  user, 
  showRegister, 
  handleRegister, 
  setShowRegister, 
  checkUserForWallet 
}: {
  user: any;
  showRegister: boolean;
  handleRegister: any;
  setShowRegister: any;
  checkUserForWallet: any;
}) {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(true);
  const [lastCheckedWallet, setLastCheckedWallet] = useState<string | null>(null);

  const checkBackendConnectionStatus = useCallback(async () => {
    try {
      setIsCheckingConnection(true);
      const isConnected = await authService.checkBackendConnection();
      setBackendConnected(isConnected);
      return isConnected;
    } catch (error) {
      console.error('Error checking backend connection:', error);
      setBackendConnected(false);
      return false;
    } finally {
      setIsCheckingConnection(false);
    }
  }, []);

  // Efecto para verificar usuario solo cuando se conecta una wallet nueva
  useEffect(() => {
    // El hook useAuth ahora maneja automáticamente la verificación de usuario
    // cuando se conecta una wallet, así que solo necesitamos limpiar el estado local
    if (!connected || !publicKey) {
      setLastCheckedWallet(null);
      return;
    }

    const walletAddress = publicKey.toString();
    setLastCheckedWallet(walletAddress);
  }, [connected, publicKey?.toString()]);

  // Efecto para verificar la conexión con el backend
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const initializeBackendCheck = async () => {
      await checkBackendConnectionStatus();
      
      // Establecer verificación periódica
      intervalId = setInterval(async () => {
        const newConnectionStatus = await checkBackendConnectionStatus();
        if (newConnectionStatus !== backendConnected && backendConnected !== null) {
          // Solo mostrar notificación si hubo un cambio en el estado de conexión - Log eliminado
        }
      }, BACKEND_CHECK_INTERVAL);
    };
    
    initializeBackendCheck();
    
    // Limpiar intervalo al desmontar
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [checkBackendConnectionStatus]);

  // Mostrar indicador de carga en la primera verificación
  if (backendConnected === null && isCheckingConnection) {
    return (
      <div className="d-flex flex-column min-vh-100 justify-content-center align-items-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Conectando con el servidor...</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 w-100">
        <SkipToContent />
        {backendConnected === false && (
          <Alert variant="danger" className="text-center mb-0 py-2">
            <strong>Servidor no disponible:</strong> Lo sentimos, el servidor no está disponible en este momento. Por favor, inténtalo más tarde.
            <Button 
              variant="link" 
              className="p-0 ms-2 text-decoration-none" 
              onClick={checkBackendConnectionStatus}
              disabled={isCheckingConnection}
            >
              {isCheckingConnection ? 'Verificando...' : 'Reintentar conexión'}
            </Button>
          </Alert>
        )}
        <AppNavbar user={user} connected={connected} />
        <main id="main-content" className="pt-2 flex-grow-1">
          <Container fluid className="p-1">
            <AppRoutes user={user} />
          </Container>
        </main>
        
        {/* Only show RegisterModal when wallet is connected and there's a valid publicKey */}
        {connected && publicKey && (
          <RegisterModal
            show={showRegister}
            walletAddress={publicKey.toString()}
            onSubmit={async (userData: any) => {
              const newUser = await handleRegister(userData);
              if (newUser) {
                setShowRegister(false);
              }
            }}
            onClose={() => setShowRegister(false)}
          />
        )}
        
        <AppFooter />
    </div>
  );
}

function App() {
  // Configuración de Solana
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = clusterApiUrl(network);
  
  // Configuración de wallets con manejo de errores mejorado
  const wallets = useMemo(() => {
    try {
      const walletAdapters = [];
      
      // Intentar crear Phantom adapter
      try {
        const phantom = new PhantomWalletAdapter();
        walletAdapters.push(phantom);
        console.log('✓ Phantom wallet adapter creado exitosamente');
      } catch (error) {
        console.warn('⚠️ Error creando Phantom adapter:', error);
      }
      
      // Intentar crear Solflare adapter
      try {
        const solflare = new SolflareWalletAdapter();
        walletAdapters.push(solflare);
        console.log('✓ Solflare wallet adapter creado exitosamente');
      } catch (error) {
        console.warn('⚠️ Error creando Solflare adapter:', error);
      }
      
      console.log(`Total wallet adapters creados: ${walletAdapters.length}`);
      return walletAdapters;
    } catch (error) {
      console.error('Error general inicializando adaptadores de wallet:', error);
      return [];
    }
  }, []);

  // Log para debugging
  useEffect(() => {
    console.log('App: Wallets configurados:', wallets.length);
    console.log('App: Network:', network);
    console.log('App: Endpoint:', endpoint);
  }, [wallets, network, endpoint]);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ErrorBoundary>
        <ConnectionProvider 
          endpoint={endpoint}
          config={{
            commitment: 'processed',
            confirmTransactionInitialTimeout: 120000,
          }}
        >
          <WalletErrorBoundary>
            <WalletProvider 
              wallets={wallets} 
              onError={(error) => {
                console.error('WalletProvider Error:', error);
                // Mostrar el error para diagnosticar el problema
              }}
              autoConnect={true}
            >
              <WalletModalProvider>
                <AppWithAuth />
              </WalletModalProvider>
            </WalletProvider>
          </WalletErrorBoundary>
        </ConnectionProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
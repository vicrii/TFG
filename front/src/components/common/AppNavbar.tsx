import React from 'react';
import { Link } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Navbar, Container, Nav, NavDropdown, Button, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaRobot, FaUserShield, FaPlus, FaList, FaUsers, 
  FaBook, FaHome, FaUser, FaGraduationCap, FaCog, FaFont, FaCode, FaFileAlt
} from 'react-icons/fa';
import { useUI } from '../../context/ThemeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import solanaLogo from '../../assets/solana-logo.svg';
import { useWallet } from '@solana/wallet-adapter-react';
import { AppNavbarProps } from '../../types/common.types';

// crear para conectar la wallet
const SafeWalletButton = () => {
  try {
    // el boton solo aparece si estamos en un entorno de navegador
    if (typeof window !== 'undefined') {
      return <WalletMultiButton />;
    }
    return null;
  } catch (error) {
    console.error('Error al renderizar el boton de wallet:', error);
    return null;
  }
};

const AppNavbar: React.FC<AppNavbarProps> = ({ 
  user,
  connected,
  onThemeToggle,
  className = ''
}) => {
  const location = useLocation();
  const { 
    fontSize, setFontSize,
    toggleAnimations, 
    animationsEnabled
  } = useUI();
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  
  const isModerator = user && user.role === 'moderator';
  
  // Determinar si la ruta actual está en la sección de perfil o configuración
  const isProfileSection = () => {
    return location.pathname === '/profile';
  };

  const isModeratorSection = () => {
    return location.pathname === '/moderator' || 
           location.pathname === '/create-course' || 
           location.pathname === '/test-editor';
  };

  const isCoursesSection = () => {
    return location.pathname === '/courses-list' || 
           location.pathname === '/create-course' || 
           location.pathname.includes('/course/');
  };

  const isUsersSection = () => {
    return location.pathname === '/users-list';
  };

  const isProfileActive = 
    location.pathname === '/profile' ||
    location.pathname === '/my-courses';

  const isToolsActive = 
    location.pathname === '/test-editor';

  // Escuchar el evento de scroll para cambiar la apariencia del navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar el menú de tema cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cerrar el menú de tema cuando se presiona ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  // Gestionar cambio de tamaño de fuente
  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    setShowThemeMenu(false);
  };

  // Renderiza tooltip para un ítem de navegación
  const renderTooltip = (props: any, text: string) => (
    <Tooltip id={`tooltip-${text.toLowerCase().replace(/\s/g, '-')}`} {...props}>
      {text}
    </Tooltip>
  );

  return (
    <Navbar 
      bg="white" 
      variant="light" 
      expand="lg" 
      className={`py-2 navbar-custom shadow-sm fixed-top ${scrolled ? 'scrolled' : ''} ${className}`}
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center brand-animation">
          <div className="brand-logo me-2">
            <img 
              src={solanaLogo} 
              width="40" 
              height="40" 
              className="d-inline-block align-top brand-logo-img" 
              alt="Solana Learn" 
            />
          </div>
          <div className="brand-text">
            <span className="fw-bold fs-4 text-gradient">Solana Learn</span>
            <span className="brand-tagline d-none d-md-inline">La plataforma educativa de blockchain</span>
          </div>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={`nav-item-custom ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => setExpanded(false)}
              aria-label="Página de inicio"
            >
              <FaHome className="nav-icon" /> <span className="nav-text">Inicio</span>
            </Nav.Link>
            
            <Nav.Link 
              as={Link} 
              to="/courses" 
              className={`nav-item-custom ${location.pathname === '/courses' || location.pathname.includes('/courses/') ? 'active' : ''}`}
              onClick={() => setExpanded(false)}
              aria-label="Ver cursos disponibles"
            >
              <FaBook className="nav-icon" /> <span className="nav-text">Cursos</span>
            </Nav.Link>
            
            {user && (
              <Nav.Link 
                as={Link} 
                to="/my-courses" 
                className={`nav-item-custom ${location.pathname === '/my-courses' ? 'active' : ''}`}
                onClick={() => setExpanded(false)}
                aria-label="Ver mis cursos"
              >
                <FaGraduationCap className="nav-icon" /> <span className="nav-text">Mis Cursos</span>
              </Nav.Link>
            )}
            
            {user ? (
              <NavDropdown
                title={
                  <span className={`nav-dropdown-title ${isProfileSection() ? 'active' : ''}`}>
                    <FaUser className="nav-icon" /> <span className="nav-text">Mi Cuenta</span>
                  </span>
                }
                id="profile-dropdown"
                className="nav-dropdown-custom"
              >
                <NavDropdown.Item as={Link} to="/profile" className="dropdown-item-custom" onClick={() => setExpanded(false)}>
                  <FaUser className="dropdown-icon" /> Mi Perfil
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
            <Nav.Link 
              as={Link} 
              to="/profile" 
              className={`nav-item-custom ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => setExpanded(false)}
              aria-label="Ver mi perfil"
            >
              <FaUser className="nav-icon" /> <span className="nav-text">Perfil</span>
            </Nav.Link>
            )}
            
            {isModerator && (
              <NavDropdown 
                title={
                  <span className={`nav-dropdown-title ${isModeratorSection() ? 'active' : ''}`}>
                    <FaUserShield className="nav-icon" /> <span className="nav-text">Moderador</span>
                  </span>
                } 
                id="moderator-dropdown"
                className="nav-dropdown-custom"
              >
                <NavDropdown.Item as={Link} to="/moderator" className="dropdown-item-custom" onClick={() => setExpanded(false)}>
                  <FaUserShield className="dropdown-icon" /> Panel Principal
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item as={Link} to="/create-course" className="dropdown-item-custom" onClick={() => setExpanded(false)}>
                  <FaPlus className="dropdown-icon" /> Añadir Curso
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/courses-list" className="dropdown-item-custom" onClick={() => setExpanded(false)}>
                  <FaList className="dropdown-icon" /> Listado de Cursos
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/users-list" className="dropdown-item-custom" onClick={() => setExpanded(false)}>
                  <FaUsers className="dropdown-icon" /> Gestión de Usuarios
                </NavDropdown.Item>
              </NavDropdown>
            )}
            
            {/* Menú de accesibilidad */}
            <div className="position-relative" ref={themeMenuRef}>
              <OverlayTrigger
                placement="bottom"
                overlay={(props) => renderTooltip(props, 'Opciones de accesibilidad')}
              >
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="ms-2 d-flex align-items-center justify-content-center"
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  aria-label="Opciones de accesibilidad"
                  aria-expanded={showThemeMenu}
                  aria-controls="theme-dropdown-menu"
              style={{ width: '38px', height: '38px', borderRadius: '50%', padding: 0 }}
            >
              <FaCog size={16} />
            </Button>
              </OverlayTrigger>

              {showThemeMenu && (
                <div 
                  id="theme-dropdown-menu"
                  className="theme-dropdown-menu p-3 shadow bg-white text-dark"
                >
                  <h6 className="border-bottom pb-2 mb-3">Configuración</h6>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">Tamaño de texto</span>
                      </div>
                      <div className="theme-options d-flex gap-2">
                        <Button 
                          variant={fontSize === 'small' ? 'primary' : 'outline-secondary'} 
                          size="sm" 
                          onClick={() => handleFontSizeChange('small')}
                          aria-pressed={fontSize === 'small'}
                        >
                          <FaFont size={12} className="me-1" /> Pequeño
                        </Button>
                        <Button 
                          variant={fontSize === 'medium' ? 'primary' : 'outline-secondary'} 
                          size="sm" 
                          onClick={() => handleFontSizeChange('medium')}
                          aria-pressed={fontSize === 'medium'}
                        >
                          <FaFont size={14} className="me-1" /> Mediano
                        </Button>
                        <Button 
                          variant={fontSize === 'large' ? 'primary' : 'outline-secondary'} 
                          size="sm" 
                          onClick={() => handleFontSizeChange('large')}
                          aria-pressed={fontSize === 'large'}
                        >
                          <FaFont size={16} className="me-1" /> Grande
                        </Button>
                      </div>
                    </div>
                    
                    <div className="accessibility-options">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">Accesibilidad</span>
                      </div>
                      <div className="d-flex flex-column gap-2">
                        <Button 
                          variant={animationsEnabled ? 'outline-secondary' : 'primary'} 
                          size="sm" 
                          onClick={() => {
                            toggleAnimations();
                            setShowThemeMenu(false);
                          }}
                          aria-pressed={!animationsEnabled}
                        >
                          <FaCog className="me-1" /> 
                          {animationsEnabled ? 'Reducir animaciones' : 'Restaurar animaciones'}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="d-flex justify-content-end mt-3">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setShowThemeMenu(false)}
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                )}
            </div>
            
            <div className="nav-wallet-wrapper">
              <SafeWalletButton />
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;

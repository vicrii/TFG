import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, ProgressBar, Alert } from 'react-bootstrap';
import { 
  FaTrophy, FaGraduationCap, FaLaptopCode, FaCode, FaChartLine, 
  FaCalendarAlt, FaRegClock, FaHandshake, FaLock, FaCrown, 
  FaMedal, FaUserGraduate, FaStar, FaAward, FaFire
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './AchievementSystem.css';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  level: number;
  maxLevel: number;
  category: 'learning' | 'contribution' | 'community' | 'mastery';
  unlockedAt: string | null;
  progress: number;
  thresholds: number[];
  badgeColor: string;
  rewards?: {
    points: number;
    specialAccess?: string;
    nftReward?: boolean;
  };
}

const AchievementSystem: React.FC = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState<boolean>(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // En un caso real, obtendríamos estos datos de una API
        // Para este ejemplo, simulamos datos cargados desde el backend
        
        // Esperar 1 segundo para simular la carga desde el servidor
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockAchievements: Achievement[] = generateMockAchievements();
        setAchievements(mockAchievements);
        
        // Guardar logros nuevos obtenidos en el último día
        const newlyUnlocked = mockAchievements
          .filter(a => a.unlockedAt && 
            new Date(a.unlockedAt).getTime() > Date.now() - 24 * 60 * 60 * 1000)
          .map(a => a.id);
        
        setNewAchievements(newlyUnlocked);
        
      } catch (err) {
        console.error('Error fetching achievements:', err);
        setError('No se pudieron cargar los logros. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.walletAddress) {
      fetchAchievements();
    }
  }, [user]);

  const handleShowDetails = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAchievement(null);
  };

  const filterAchievements = () => {
    let filtered = [...achievements];
    
    // Filtrar por categoría
    if (activeCategory !== 'all') {
      filtered = filtered.filter(a => a.category === activeCategory);
    }
    
    // Filtrar solo desbloqueados si la opción está activa
    if (showUnlockedOnly) {
      filtered = filtered.filter(a => a.unlockedAt !== null);
    }
    
    return filtered;
  };

  const getTotalProgress = () => {
    if (achievements.length === 0) return 0;
    
    const unlockedCount = achievements.filter(a => a.unlockedAt !== null).length;
    return Math.round((unlockedCount / achievements.length) * 100);
  };

  const getNextAchievementToUnlock = () => {
    const locked = achievements.filter(a => a.unlockedAt === null);
    if (locked.length === 0) return null;
    
    // Encontrar el que tenga mayor progreso
    return locked.reduce((prev, current) => 
      (prev.progress > current.progress) ? prev : current
    );
  };

  const getAchievementLevel = (achievement: Achievement) => {
    if (achievement.unlockedAt === null) return 0;
    return achievement.level;
  };

  // Simular algunos logros para mostrar
  function generateMockAchievements(): Achievement[] {
    return [
      {
        id: 'first-lesson',
        title: 'Primeros Pasos',
        description: 'Completa tu primera lección en Solana Learn',
        icon: <FaGraduationCap />,
        level: 1,
        maxLevel: 1,
        category: 'learning',
        unlockedAt: '2023-06-15T14:32:15Z',
        progress: 100,
        thresholds: [1],
        badgeColor: 'primary',
        rewards: {
          points: 10
        }
      },
      {
        id: 'course-master',
        title: 'Maestro de Cursos',
        description: 'Completa cursos en Solana Learn',
        icon: <FaUserGraduate />,
        level: 2,
        maxLevel: 3,
        category: 'learning',
        unlockedAt: '2023-07-20T09:12:45Z',
        progress: 66,
        thresholds: [1, 3, 5],
        badgeColor: 'success',
        rewards: {
          points: 50
        }
      },
      {
        id: 'streak-warrior',
        title: 'Guerrero Constante',
        description: 'Mantén tu racha de aprendizaje día tras día',
        icon: <FaFire />,
        level: 1,
        maxLevel: 4,
        category: 'learning',
        unlockedAt: '2023-08-01T18:45:30Z',
        progress: 25,
        thresholds: [3, 7, 15, 30],
        badgeColor: 'danger',
        rewards: {
          points: 30
        }
      },
      {
        id: 'code-ninja',
        title: 'Ninja del Código',
        description: 'Completa ejercicios de programación en Solana',
        icon: <FaCode />,
        level: 0,
        maxLevel: 3,
        category: 'mastery',
        unlockedAt: null,
        progress: 80,
        thresholds: [5, 15, 30],
        badgeColor: 'info',
        rewards: {
          points: 50
        }
      },
      {
        id: 'blockchain-explorer',
        title: 'Explorador Blockchain',
        description: 'Completa cursos de diferentes categorías',
        icon: <FaChartLine />,
        level: 0,
        maxLevel: 3,
        category: 'learning',
        unlockedAt: null,
        progress: 60,
        thresholds: [3, 5, 8],
        badgeColor: 'success',
        rewards: {
          points: 40
        }
      },
      {
        id: 'perfect-score',
        title: 'Puntuación Perfecta',
        description: 'Obtén 100% en evaluaciones',
        icon: <FaStar />,
        level: 2,
        maxLevel: 3,
        category: 'mastery',
        unlockedAt: '2023-08-15T11:20:10Z',
        progress: 66,
        thresholds: [1, 3, 5],
        badgeColor: 'warning',
        rewards: {
          points: 50
        }
      },
      {
        id: 'community-helper',
        title: 'Ayudante Comunitario',
        description: 'Ayuda a otros estudiantes respondiendo preguntas',
        icon: <FaHandshake />,
        level: 0,
        maxLevel: 3,
        category: 'community',
        unlockedAt: null,
        progress: 20,
        thresholds: [5, 15, 30],
        badgeColor: 'secondary',
        rewards: {
          points: 30
        }
      },
      {
        id: 'early-adopter',
        title: 'Adoptador Temprano',
        description: 'Únete a la plataforma en sus primeros días',
        icon: <FaAward />,
        level: 1,
        maxLevel: 1,
        category: 'community',
        unlockedAt: '2023-05-10T08:15:30Z',
        progress: 100,
        thresholds: [1],
        badgeColor: 'primary',
        rewards: {
          points: 20,
          nftReward: true
        }
      },
      {
        id: 'smart-contract-expert',
        title: 'Experto en Smart Contracts',
        description: 'Domina los cursos de Smart Contracts en Solana',
        icon: <FaLaptopCode />,
        level: 0,
        maxLevel: 3,
        category: 'mastery',
        unlockedAt: null,
        progress: 40,
        thresholds: [1, 2, 3],
        badgeColor: 'dark',
        rewards: {
          points: 100,
          specialAccess: 'Acceso a workshops avanzados'
        }
      },
      {
        id: 'study-time',
        title: 'Tiempo de Estudio',
        description: 'Acumula horas de aprendizaje en la plataforma',
        icon: <FaRegClock />,
        level: 2,
        maxLevel: 4,
        category: 'learning',
        unlockedAt: '2023-07-15T16:45:22Z',
        progress: 50,
        thresholds: [10, 25, 50, 100],
        badgeColor: 'info',
        rewards: {
          points: 40
        }
      },
      {
        id: 'solana-master',
        title: 'Maestro Solana',
        description: 'Completa todos los cursos principales de Solana',
        icon: <FaCrown />,
        level: 0,
        maxLevel: 1,
        category: 'mastery',
        unlockedAt: null,
        progress: 65,
        thresholds: [1],
        badgeColor: 'warning',
        rewards: {
          points: 200,
          nftReward: true,
          specialAccess: 'Certificación verificada en blockchain'
        }
      },
      {
        id: 'consistent-learner',
        title: 'Aprendiz Constante',
        description: 'Inicia sesión regularmente para aprender',
        icon: <FaCalendarAlt />,
        level: 3,
        maxLevel: 3,
        category: 'learning',
        unlockedAt: '2023-08-10T10:30:15Z',
        progress: 100,
        thresholds: [10, 30, 60],
        badgeColor: 'primary',
        rewards: {
          points: 60
        }
      }
    ];
  }

  const renderCategoryBadge = (category: string) => {
    switch (category) {
      case 'learning':
        return <Badge bg="primary">Aprendizaje</Badge>;
      case 'contribution':
        return <Badge bg="success">Contribución</Badge>;
      case 'community':
        return <Badge bg="info">Comunidad</Badge>;
      case 'mastery':
        return <Badge bg="warning">Maestría</Badge>;
      default:
        return <Badge bg="secondary">{category}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3">Cargando tus logros...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="my-4">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  if (!user?.walletAddress) {
    return (
      <Alert variant="info" className="my-4">
        <Alert.Heading>Conéctate para ver tus logros</Alert.Heading>
        <p>Necesitas conectar tu wallet para ver y desbloquear logros en la plataforma.</p>
      </Alert>
    );
  }

  const filteredAchievements = filterAchievements();
  const nextAchievement = getNextAchievementToUnlock();
  const totalProgress = getTotalProgress();

  return (
    <Container className="achievements-system py-4">
      {/* Resumen de logros */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="achievement-summary-card border-0 shadow-sm">
            <Card.Body>
              <h4 className="mb-3">Progreso de Logros</h4>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Total completado: <strong>{totalProgress}%</strong></span>
                <span><strong>{achievements.filter(a => a.unlockedAt !== null).length}</strong> de <strong>{achievements.length}</strong> logros</span>
              </div>
              <ProgressBar 
                now={totalProgress} 
                variant="primary" 
                className="progress-lg mb-4" 
              />
              
              {nextAchievement && (
                <div className="next-achievement p-3 rounded bg-light">
                  <h5>Próximo logro a desbloquear</h5>
                  <div className="d-flex align-items-center">
                    <div className={`achievement-icon me-3 bg-${nextAchievement.badgeColor}`}>
                      {nextAchievement.icon}
                    </div>
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{nextAchievement.title}</h6>
                      <p className="text-muted small mb-2">{nextAchievement.description}</p>
                      <ProgressBar 
                        now={nextAchievement.progress} 
                        variant={nextAchievement.badgeColor} 
                        className="mb-1" 
                        style={{ height: '6px' }} 
                      />
                      <small className="text-muted">{nextAchievement.progress}% completado</small>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="achievement-stats-card border-0 shadow-sm h-100">
            <Card.Body>
              <h4 className="mb-3">Estadísticas</h4>
              <div className="achievement-stat-item d-flex justify-content-between mb-3">
                <span>Total de puntos</span>
                <span className="fw-bold">
                  {achievements
                    .filter(a => a.unlockedAt !== null)
                    .reduce((sum, a) => sum + (a.rewards?.points || 0) * getAchievementLevel(a), 0)}
                </span>
              </div>
              <div className="achievement-stat-item d-flex justify-content-between mb-3">
                <span>Logros de Maestría</span>
                <span className="fw-bold">
                  {achievements.filter(a => a.category === 'mastery' && a.unlockedAt !== null).length}
                </span>
              </div>
              <div className="achievement-stat-item d-flex justify-content-between mb-3">
                <span>Logros recientes</span>
                <span className="fw-bold">
                  {achievements.filter(a => 
                    a.unlockedAt && new Date(a.unlockedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
                  ).length}
                </span>
              </div>
              <div className="achievement-stat-item d-flex justify-content-between">
                <span>Nivel de estudiante</span>
                <span className="fw-bold">
                  {Math.floor(totalProgress / 10) + 1}
                </span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros */}
      <div className="achievements-filters mb-4">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Button 
            variant={activeCategory === 'all' ? "primary" : "outline-primary"} 
            onClick={() => setActiveCategory('all')}
            className="filter-btn"
          >
            <FaTrophy className="me-2" /> Todos
          </Button>
          <Button 
            variant={activeCategory === 'learning' ? "primary" : "outline-primary"} 
            onClick={() => setActiveCategory('learning')}
            className="filter-btn"
          >
            <FaGraduationCap className="me-2" /> Aprendizaje
          </Button>
          <Button 
            variant={activeCategory === 'mastery' ? "primary" : "outline-primary"} 
            onClick={() => setActiveCategory('mastery')}
            className="filter-btn"
          >
            <FaLaptopCode className="me-2" /> Maestría
          </Button>
          <Button 
            variant={activeCategory === 'community' ? "primary" : "outline-primary"} 
            onClick={() => setActiveCategory('community')}
            className="filter-btn"
          >
            <FaHandshake className="me-2" /> Comunidad
          </Button>
          <div className="ms-auto">
            <Button
              variant={showUnlockedOnly ? "success" : "outline-secondary"}
              onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
              className="filter-btn"
            >
              <FaMedal className="me-2" /> Solo desbloqueados
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de logros */}
      {filteredAchievements.length > 0 ? (
        <Row className="achievements-grid">
          {filteredAchievements.map((achievement) => (
            <Col md={6} lg={4} key={achievement.id} className="mb-4">
              <Card 
                className={`achievement-card h-100 border-0 shadow-sm ${newAchievements.includes(achievement.id) ? 'new-achievement' : ''}`}
                onClick={() => handleShowDetails(achievement)}
              >
                <Card.Body>
                  <div className="d-flex align-items-center mb-3">
                    <div className={`achievement-icon me-3 bg-${achievement.badgeColor} ${achievement.unlockedAt ? '' : 'locked'}`}>
                      {achievement.unlockedAt ? achievement.icon : <FaLock />}
                    </div>
                    <div>
                      <h5 className="mb-1">{achievement.title}</h5>
                      {renderCategoryBadge(achievement.category)}
                    </div>
                  </div>
                  <p className="card-description">{achievement.description}</p>
                  
                  {achievement.unlockedAt ? (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-success">
                          <FaCheckCircle className="me-1" /> Desbloqueado
                        </span>
                        {achievement.maxLevel > 1 && (
                          <span>Nivel {achievement.level}/{achievement.maxLevel}</span>
                        )}
                      </div>
                      {achievement.maxLevel > 1 && (
                        <ProgressBar 
                          now={(achievement.level / achievement.maxLevel) * 100} 
                          variant={achievement.badgeColor} 
                          className="mt-2" 
                        />
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-muted">Progreso</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <ProgressBar 
                        now={achievement.progress} 
                        variant={achievement.badgeColor} 
                        className="mt-1" 
                      />
                    </div>
                  )}
                  
                  {newAchievements.includes(achievement.id) && (
                    <div className="new-badge">¡NUEVO!</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Alert variant="info" className="text-center">
          No se encontraron logros que coincidan con los filtros seleccionados.
        </Alert>
      )}

      {/* Modal de detalle */}
      <Modal 
        show={showModal} 
        onHide={handleCloseModal}
        centered
        className="achievement-detail-modal"
      >
        {selectedAchievement && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Detalles del Logro</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="text-center mb-4">
                <div className={`achievement-icon-lg mx-auto bg-${selectedAchievement.badgeColor} ${selectedAchievement.unlockedAt ? '' : 'locked'}`}>
                  {selectedAchievement.unlockedAt ? selectedAchievement.icon : <FaLock />}
                </div>
                <h3 className="mt-3">{selectedAchievement.title}</h3>
                {renderCategoryBadge(selectedAchievement.category)}
              </div>
              
              <div className="achievement-details">
                <p className="mb-4">{selectedAchievement.description}</p>
                
                {selectedAchievement.unlockedAt ? (
                  <div className="achievement-unlocked mb-4">
                    <h5>Estado: <span className="text-success">Desbloqueado</span></h5>
                    <p>Fecha de desbloqueo: {new Date(selectedAchievement.unlockedAt).toLocaleDateString()}</p>
                    
                    {selectedAchievement.maxLevel > 1 && (
                      <div className="mt-3">
                        <h5>Nivel: {selectedAchievement.level}/{selectedAchievement.maxLevel}</h5>
                        <ProgressBar 
                          now={(selectedAchievement.level / selectedAchievement.maxLevel) * 100} 
                          variant={selectedAchievement.badgeColor} 
                          className="mt-2 mb-3" 
                        />
                        
                        {selectedAchievement.level < selectedAchievement.maxLevel && (
                          <div>
                            <p>Próximo nivel: Completa {selectedAchievement.thresholds[selectedAchievement.level]} para alcanzar nivel {selectedAchievement.level + 1}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="achievement-locked mb-4">
                    <h5>Estado: <span className="text-muted">Bloqueado</span></h5>
                    <p>Progreso actual: {selectedAchievement.progress}%</p>
                    <ProgressBar 
                      now={selectedAchievement.progress} 
                      variant={selectedAchievement.badgeColor} 
                      className="mb-3" 
                    />
                    <p>Para desbloquear: Completa {selectedAchievement.thresholds[0]} {selectedAchievement.category === 'learning' ? 'lecciones' : selectedAchievement.category === 'mastery' ? 'cursos' : 'acciones'}</p>
                  </div>
                )}
                
                <div className="achievement-rewards">
                  <h5>Recompensas</h5>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <FaStar className="text-warning me-2" />
                      {selectedAchievement.rewards?.points || 0} puntos {selectedAchievement.maxLevel > 1 && `por nivel (Total: ${(selectedAchievement.rewards?.points || 0) * selectedAchievement.level} puntos)`}
                    </li>
                    {selectedAchievement.rewards?.specialAccess && (
                      <li className="mb-2">
                        <FaCrown className="text-warning me-2" />
                        {selectedAchievement.rewards.specialAccess}
                      </li>
                    )}
                    {selectedAchievement.rewards?.nftReward && (
                      <li className="mb-2">
                        <FaMedal className="text-warning me-2" />
                        Insignia NFT exclusiva
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cerrar
              </Button>
              {!selectedAchievement.unlockedAt && (
                <Button 
                  variant="primary" 
                  onClick={() => window.location.href = "/courses"}
                >
                  Seguir aprendiendo
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>
    </Container>
  );
};

export default AchievementSystem; 
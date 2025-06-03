import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button, Card, Badge, Spinner } from 'react-bootstrap';
import { FaGraduationCap, FaRocket, FaCoins, FaArrowRight, FaUsers, FaChartLine, FaLaptopCode, FaRegClock, FaMedal, FaUserGraduate, FaCertificate, FaComment, FaBook, FaPlay } from 'react-icons/fa';
import { courseService, ICourseData } from '../../services/course/courseService';
import { analyticsService } from '../../services/analytics/analyticsService';
import { useAuth } from '../../hooks/useAuth';
import WalletDiagnostics from '../../components/common/WalletDiagnostics';

// Interfaz para las estadísticas de la plataforma
interface PlatformStats {
  users: number;
  courses: number;
  lessons: number;
  loadingStats: boolean;
}

function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<ICourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<ICourseData[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    users: 0,
    courses: 0,
    lessons: 0,
    loadingStats: true
  });
  const { user } = useAuth();

  // OPTIMIZED: Prevent multiple loads and add proper cleanup
  useEffect(() => {
    let isComponentMounted = true;

    const fetchData = async () => {
      if (!isComponentMounted) return;

      try {
        // OPTIMIZATION: Load courses and stats in parallel to reduce loading time
        const [coursesResult, statsResult] = await Promise.all([
          // Obtener cursos públicos para mostrar en la página principal
          courseService.getPublicCourses({
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }).catch(error => {
            console.error("Error al cargar cursos:", error);
            return [];
          }),
          
          // Obtener estadísticas reales públicas para TODOS los usuarios
          analyticsService.getPublicStats().catch(error => {
            console.error('Error obteniendo estadísticas públicas:', error);
            return { totalUsers: 0, totalCourses: 0, totalLessons: 0 };
          })
        ]);

        if (!isComponentMounted) return;

        console.log('Cursos obtenidos:', coursesResult); // Debug

        // Separar cursos destacados (los más recientes o populares)
        setFeaturedCourses(coursesResult.slice(0, 6));
        
        // Mostrar recomendaciones solo si hay usuario autenticado
        if (user?.walletAddress && coursesResult.length > 6) {
          setRecommendations(coursesResult.slice(6, 9));
          setShowRecommendations(true);
        } else {
          setRecommendations([]);
          setShowRecommendations(false);
        }

        console.log('Estadísticas reales obtenidas:', statsResult); // Debug
        
        setPlatformStats({
          users: statsResult.totalUsers || 0,
          courses: statsResult.totalCourses || 0,
          lessons: statsResult.totalLessons || 0,
          loadingStats: false
        });

      } catch (error) {
        if (!isComponentMounted) return;
        console.error("Error general al cargar datos:", error);
        
        // En caso de error, usar valores por defecto muy conservadores
        setFeaturedCourses([]);
        setRecommendations([]);
        setShowRecommendations(false);
        setPlatformStats({
          users: 0,
          courses: 0,
          lessons: 0,
          loadingStats: false
        });
      } finally {
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchData();

    return () => {
      isComponentMounted = false;
    };
  }, [user?.walletAddress]); // SIMPLIFIED: Only user wallet change should trigger reload

  // Función para mostrar el nivel del curso con mejor contraste
  const renderLevel = (level: string) => {
    let badgeClass = "";
    let levelText = "";
    
    switch (level) {
      case "beginner":
        badgeClass = "bg-success text-white";
        levelText = "Principiante";
        break;
      case "intermediate":
        badgeClass = "bg-warning text-dark";
        levelText = "Intermedio";
        break;
      case "advanced":
        badgeClass = "bg-danger text-white";
        levelText = "Avanzado";
        break;
      default:
        badgeClass = "bg-primary text-white";
        levelText = "Todos los niveles";
    }
    
    return <Badge className={`${badgeClass} px-3 py-2 rounded-pill`}>{levelText}</Badge>;
  };

  // Función para mostrar el precio
  const renderPrice = (price: number) => {
    if (price === 0) {
      return <Badge bg="success" className="px-3 py-2 rounded-pill text-white">Gratis</Badge>;
    } else {
      return <Badge bg="primary" className="px-3 py-2 rounded-pill text-white">{price} SOL</Badge>;
    }
  };

  // Testimonios reales de estudiantes
  const testimonials = [
    {
      id: 1,
      name: "María González",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612e2ff?w=150&h=150&fit=crop&crop=face",
      role: "Desarrolladora Blockchain",
      text: "Solana Learn me permitió hacer la transición de desarrollo web tradicional a blockchain. Los cursos son prácticos y van directo al grano. En 3 meses ya tenía mi primera dApp funcionando."
    },
    {
      id: 2,
      name: "Carlos Mendoza",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      role: "Tech Lead",
      text: "La calidad del contenido es excepcional. Los instructores realmente conocen el ecosistema Solana y transmiten ese conocimiento de manera clara y estructurada."
    },
    {
      id: 3,
      name: "Ana Rodríguez",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      role: "Freelance Developer",
      text: "Me encanta poder aprender a mi ritmo. La plataforma es intuitiva y los proyectos prácticos realmente te preparan para desarrollar en el mundo real."
    }
  ];

  // Características de la plataforma Solana Learn
  const platformFeatures = [
    {
      icon: <FaLaptopCode size={40} className="text-primary mb-3" />,
      title: "Aprendizaje Práctico",
      description: "Desarrolla aplicaciones reales mientras aprendes. Cada curso incluye proyectos hands-on que puedes agregar a tu portafolio."
    },
    {
      icon: <FaRegClock size={40} className="text-primary mb-3" />,
      title: "Tu Ritmo, Tu Horario",
      description: "Acceso 24/7 a todo el contenido. Estudia cuando quieras, desde donde quieras, con soporte multiplataforma."
    },
    {
      icon: <FaCertificate size={40} className="text-primary mb-3" />,
      title: "Certificaciones Verificables",
      description: "Obtén certificados almacenados en la blockchain de Solana que validan tus habilidades ante empleadores."
    },
    {
      icon: <FaChartLine size={40} className="text-primary mb-3" />,
      title: "Progreso Detallado",
      description: "Sistema de analíticas avanzado que rastrea tu progreso y sugiere áreas de mejora personalizadas."
    }
  ];

  return (
    <Container fluid className="p-0 home-page">
      {/* Hero Section mejorado */}
      <div className="position-relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '75vh'
      }}>
        {/* Efectos visuales de fondo */}
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 50%)',
          zIndex: 1
        }}></div>
        
        <Container className="py-5 position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center min-vh-50">
            <Col lg={6} className="text-center text-lg-start mb-4 mb-lg-0">
              <div className="text-white">
                <h1 className="display-3 fw-bold mb-4">
                  Aprende desarrollo en <span style={{ color: '#14F195' }}>Solana</span>
                </h1>
                <p className="lead mb-4 opacity-90" style={{ fontSize: '1.25rem' }}>
                  La plataforma más completa para aprender blockchain de Solana. 
                  Desde conceptos básicos hasta aplicaciones avanzadas de DeFi y NFTs.
                </p>
                <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center justify-content-lg-start">
                  <Link to="/courses" className="text-decoration-none">
                    <Button 
                      size="lg" 
                      className="px-5 py-3 fw-bold border-0 shadow-lg"
                      style={{ 
                        background: 'linear-gradient(45deg, #14F195, #9945FF)',
                        color: 'white'
                      }}
                    >
                      Explorar Cursos <FaArrowRight className="ms-2" />
                    </Button>
                  </Link>
                  <Link to="/profile" className="text-decoration-none">
                    <Button 
                      variant="outline-light" 
                      size="lg" 
                      className="px-5 py-3 fw-bold border-2"
                    >
                      Mi Perfil
                    </Button>
                  </Link>
                </div>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="position-relative">
                {/* Estadísticas mejoradas */}
                <div className="row g-4 justify-content-center">
                  <div className="col-6 col-md-4">
                    <div className="text-center text-white p-3 rounded-3" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <FaUsers size={24} className="mb-2 opacity-75" />
                      {platformStats.loadingStats ? (
                        <Spinner animation="border" size="sm" className="d-block mx-auto mb-1" />
                      ) : (
                        <h3 className="fw-bold mb-1">{platformStats.users.toLocaleString()}</h3>
                      )}
                      <small className="opacity-75 d-block">Estudiantes</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-center text-white p-3 rounded-3" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <FaBook size={24} className="mb-2 opacity-75" />
                      {platformStats.loadingStats ? (
                        <Spinner animation="border" size="sm" className="d-block mx-auto mb-1" />
                      ) : (
                        <h3 className="fw-bold mb-1">{platformStats.courses}</h3>
                      )}
                      <small className="opacity-75 d-block">Cursos</small>
                    </div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-center text-white p-3 rounded-3" style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}>
                      <FaPlay size={24} className="mb-2 opacity-75" />
                      {platformStats.loadingStats ? (
                        <Spinner animation="border" size="sm" className="d-block mx-auto mb-1" />
                      ) : (
                        <h3 className="fw-bold mb-1">{platformStats.lessons.toLocaleString()}</h3>
                      )}
                      <small className="opacity-75 d-block">Lecciones</small>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Características de la plataforma */}
      <Container className="py-5">
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="display-5 fw-bold mb-3 text-dark">¿Por qué elegir Solana Learn?</h2>
            <p className="text-muted fs-5 mb-0">
              La experiencia de aprendizaje más completa para desarrolladores blockchain
            </p>
          </Col>
        </Row>
        
        <Row className="g-4">
          {platformFeatures.map((feature, index) => (
            <Col md={6} lg={3} key={index}>
              <Card className="h-100 border-0 shadow-sm text-center p-4 hover-card">
                <Card.Body>
                  <div className="mb-3">
                    {feature.icon}
                  </div>
                  <h4 className="fw-bold mb-3 text-dark">{feature.title}</h4>
                  <p className="text-muted">{feature.description}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Cursos Destacados */}
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="display-5 fw-bold mb-3 text-dark">Cursos Destacados</h2>
            <p className="text-muted fs-5">
              Descubre nuestros cursos más populares y comienza tu viaje en Solana
            </p>
          </Col>
        </Row>
        
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
            <p className="mt-3 text-muted fs-5">Cargando cursos...</p>
          </div>
        ) : featuredCourses.length === 0 ? (
          <div className="text-center py-5">
            <FaGraduationCap size={60} className="mb-3 text-muted opacity-50" />
            <h4 className="text-muted mb-3">Próximamente...</h4>
            <p className="text-muted">
              Estamos preparando cursos increíbles para ti. ¡Mantente atento!
            </p>
          </div>
        ) : (
          <>
            <Row className="g-4 mb-4">
              {featuredCourses.slice(0, 3).map((course, index) => (
                <Col md={6} lg={4} key={course._id}>
                  <Card className="h-100 border-0 shadow-sm hover-card">
                    {course.imageUrl && (
                      <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                        <Card.Img 
                          variant="top" 
                          src={course.imageUrl}
                          alt={course.title} 
                          style={{ 
                            objectFit: 'cover', 
                            height: '100%', 
                            width: '100%'
                          }} 
                        />
                        <div 
                          className="position-absolute bottom-0 start-0 w-100 p-3"
                          style={{
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-end">
                            {renderLevel(course.level)}
                            {renderPrice(course.price)}
                          </div>
                        </div>
                      </div>
                    )}
                    <Card.Body className="p-4">
                      {!course.imageUrl && (
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          {renderLevel(course.level)}
                          {renderPrice(course.price)}
                        </div>
                      )}
                      <Card.Title className="mb-3 fw-bold text-dark h5">{course.title}</Card.Title>
                      <Card.Text className="text-muted mb-4" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {course.description}
                      </Card.Text>
                      <div className="d-flex justify-content-end align-items-center mt-auto">
                        <Link to={`/course/${course._id}`} className="text-decoration-none">
                          <Button variant="primary" size="sm" className="px-3">
                            Ver curso
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {featuredCourses.length > 3 && (
              <Row className="g-4 mb-4">
                {featuredCourses.slice(3, 6).map((course, index) => (
                  <Col md={6} lg={4} key={course._id}>
                    <Card className="h-100 border-0 shadow-sm hover-card">
                      {course.imageUrl && (
                        <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                          <Card.Img 
                            variant="top" 
                            src={course.imageUrl}
                            alt={course.title} 
                            style={{ 
                              objectFit: 'cover', 
                              height: '100%', 
                              width: '100%'
                            }} 
                          />
                          <div 
                            className="position-absolute bottom-0 start-0 w-100 p-3"
                            style={{
                              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                            }}
                          >
                            <div className="d-flex justify-content-between align-items-end">
                              {renderLevel(course.level)}
                              {renderPrice(course.price)}
                            </div>
                          </div>
                        </div>
                      )}
                      <Card.Body className="p-4">
                        {!course.imageUrl && (
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            {renderLevel(course.level)}
                            {renderPrice(course.price)}
                          </div>
                        )}
                        <Card.Title className="mb-3 fw-bold text-dark h5">{course.title}</Card.Title>
                        <Card.Text className="text-muted mb-4" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {course.description}
                        </Card.Text>
                        <div className="d-flex justify-content-end align-items-center mt-auto">
                          <Link to={`/course/${course._id}`} className="text-decoration-none">
                            <Button variant="primary" size="sm" className="px-3">
                              Ver curso
                            </Button>
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            <div className="text-center mt-5">
              <Link to="/courses" className="text-decoration-none">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="px-5 py-3 fw-bold"
                >
                  Ver todos los cursos <FaArrowRight className="ms-2" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </Container>

      {/* Cursos recomendados (personalizados) */}
      {showRecommendations && recommendations.length > 0 && (
        <Container className="py-5">
          <Row className="mb-4">
            <Col className="text-center">
              <h2 className="display-5 fw-bold mb-3 text-dark">Recomendado para ti</h2>
              <p className="text-muted fs-5">
                Basado en tu perfil y progreso de aprendizaje
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            {recommendations.map((course, index) => (
              <Col md={6} lg={4} key={course._id}>
                <Card className="h-100 border-0 shadow-sm hover-card">
                  {course.imageUrl && (
                    <div className="position-relative" style={{ height: '200px', overflow: 'hidden' }}>
                      <Card.Img 
                        variant="top" 
                        src={course.imageUrl}
                        alt={course.title} 
                        style={{ 
                          objectFit: 'cover', 
                          height: '100%', 
                          width: '100%'
                        }} 
                      />
                      <div 
                        className="position-absolute bottom-0 start-0 w-100 p-3"
                        style={{
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-end">
                          {renderLevel(course.level)}
                          {renderPrice(course.price)}
                        </div>
                      </div>
                    </div>
                  )}
                  <Card.Body className="p-4">
                    {!course.imageUrl && (
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        {renderLevel(course.level)}
                        {renderPrice(course.price)}
                      </div>
                    )}
                    <Card.Title className="mb-3 fw-bold text-dark h5">{course.title}</Card.Title>
                    <Card.Text className="text-muted mb-4" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {course.description}
                    </Card.Text>
                    <div className="d-flex justify-content-end align-items-center mt-auto">
                      <Link to={`/course/${course._id}`} className="text-decoration-none">
                        <Button variant="primary" size="sm" className="px-3">
                          Ver curso
                        </Button>
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      )}

      {/* Testimonios */}
      <Container className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="display-5 fw-bold mb-3 text-dark">Historias de éxito</h2>
            <p className="text-muted fs-5">
              Descubre cómo nuestros estudiantes están transformando sus carreras
            </p>
          </Col>
        </Row>
        
        <Row className="g-4 justify-content-center">
          {testimonials.map((testimonial) => (
            <Col md={6} lg={4} key={testimonial.id}>
              <Card className="h-100 border-0 shadow-sm p-4 hover-card">
                <Card.Body className="d-flex flex-column">
                  <div className="mb-4">
                    <FaComment className="text-primary opacity-25" size={32} />
                  </div>
                  <blockquote className="mb-4 flex-grow-1">
                    <p className="text-dark fs-6 lh-lg">"{testimonial.text}"</p>
                  </blockquote>
                  <div className="d-flex align-items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="rounded-circle me-3" 
                      width="60" 
                      height="60" 
                      style={{ objectFit: 'cover' }}
                    />
                    <div>
                      <h5 className="mb-1 text-dark fw-bold">{testimonial.name}</h5>
                      <p className="text-muted mb-0">{testimonial.role}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Call to Action final */}
      <div 
        className="py-5 text-white position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100" style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 70%)',
          zIndex: 1
        }}></div>
        
        <Container className="position-relative" style={{ zIndex: 2 }}>
          <Row className="align-items-center">
            <Col lg={8} className="text-center text-lg-start">
              <h2 className="display-5 fw-bold mb-3">¿Listo para dominar Solana?</h2>
              <p className="lead mb-4 opacity-90">
                Únete a más de {platformStats.users.toLocaleString()} desarrolladores que ya están 
                construyendo el futuro de las aplicaciones descentralizadas.
              </p>
            </Col>
            <Col lg={4} className="text-center text-lg-end">
              <Link to="/courses" className="text-decoration-none">
                <Button 
                  size="lg" 
                  className="px-5 py-3 fw-bold border-0 shadow-lg"
                  style={{ 
                    background: 'linear-gradient(45deg, #14F195, #9945FF)',
                    color: 'white'
                  }}
                >
                  Comenzar ahora <FaRocket className="ms-2" />
                </Button>
              </Link>
            </Col>
          </Row>
        </Container>
      </div>

      <WalletDiagnostics />
    </Container>
  );
}

export default HomePage; 
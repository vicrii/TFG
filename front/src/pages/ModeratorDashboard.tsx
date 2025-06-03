// src/pages/ModeratorDashboardPage.tsx (Example structure)
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { FaYoutube, FaPlus, FaChalkboardTeacher, FaChartBar, FaUsers, FaBook, FaClock, FaGraduationCap, FaTrophy } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { analyticsService, IGlobalStats } from '../services/analytics/analyticsService';
import { courseService } from '../services/course/courseService';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// Interfaces para los datos estadísticos locales
interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  coursesByLevel: { level: string; count: number }[];
  coursesByPrice: { priceRange: string; count: number }[];
}

interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsersToday: number;
}

const ModeratorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<IGlobalStats | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.walletAddress || user.role !== 'moderator') {
        setError('Acceso denegado. Solo moderadores pueden ver este dashboard.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Configurar autenticación solo para cursos
        courseService.setWalletAddress(user.walletAddress);

        // Obtener estadísticas REALES usando el endpoint público (mismo que todos)
        const publicStats = await analyticsService.getPublicStats();
        console.log('Estadísticas reales para moderador:', publicStats);
        
        // Usar los datos públicos como base para globalStats para compatibilidad
        setGlobalStats({
          dailyActiveUsers: publicStats.dailyActiveUsers,
          popularCourses: publicStats.popularCourses,
          examStatistics: publicStats.examStatistics,
          totalUsers: publicStats.totalUsers,
          totalCourses: publicStats.totalCourses
        });

        // Obtener estadísticas de cursos
        const allCourses = await courseService.getAllCourses(user.walletAddress);
        const publishedCourses = allCourses.filter(course => course.published);
        const draftCourses = allCourses.filter(course => !course.published);
        
        // Agrupar cursos por nivel
        const coursesByLevel = allCourses.reduce((acc: {[key: string]: number}, course) => {
          const level = course.level || 'beginner';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {});

        // Agrupar cursos por rango de precio
        const coursesByPrice = allCourses.reduce((acc: {[key: string]: number}, course) => {
          const price = course.price || 0;
          let priceRange = '';
          
          if (price === 0) {
            priceRange = 'Gratuito';
          } else if (price < 50) {
            priceRange = 'Bajo (< $50)';
          } else if (price < 100) {
            priceRange = 'Medio ($50-$100)';
          } else {
            priceRange = 'Alto (> $100)';
          }
          
          acc[priceRange] = (acc[priceRange] || 0) + 1;
          return acc;
        }, {});

        setCourseStats({
          totalCourses: allCourses.length,
          publishedCourses: publishedCourses.length,
          draftCourses: draftCourses.length,
          coursesByLevel: Object.entries(coursesByLevel).map(([level, count]) => ({
            level: level === 'beginner' ? 'Principiante' : 
                   level === 'intermediate' ? 'Intermedio' : 
                   level === 'advanced' ? 'Avanzado' : level,
            count
          })),
          coursesByPrice: Object.entries(coursesByPrice).map(([priceRange, count]) => ({
            priceRange,
            count
          }))
        });

        // Calcular estadísticas de usuarios basadas en datos disponibles
        if (publicStats) {
          // Usar total real de usuarios si está disponible
          const totalRealUsers = publicStats.totalUsers || 0;
          
          // Calcular usuarios activos basado en datos disponibles
          let activeUsersToday = 0;
          let newUsersThisMonth = 0;
          
          if (publicStats.dailyActiveUsers && publicStats.dailyActiveUsers.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const todayActiveUsers = publicStats.dailyActiveUsers.find(d => d.date === today);
            activeUsersToday = todayActiveUsers ? todayActiveUsers.count : (publicStats.dailyActiveUsers[publicStats.dailyActiveUsers.length - 1]?.count || 0);
            
            const thisMonth = new Date().getMonth();
            newUsersThisMonth = publicStats.dailyActiveUsers
              .filter(d => new Date(d.date).getMonth() === thisMonth)
              .reduce((sum, day) => sum + day.count, 0);
          }
          
          setUserStats({
            totalUsers: totalRealUsers,
            newUsersThisMonth: newUsersThisMonth,
            activeUsersToday: activeUsersToday
          });
        } else {
          // Fallback en caso de que no haya datos de analytics disponibles
          setUserStats({
            totalUsers: 0,
            newUsersThisMonth: 0,
            activeUsersToday: 0
          });
        }

      } catch (err: any) {
        console.error('Error cargando datos del dashboard:', err);
        setError(err.message || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Cargando estadísticas...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

    return (
        <Container fluid className="px-4 py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header con gradiente */}
            <div className="text-center mb-5">
                <div className="d-inline-block p-4 rounded-3 shadow-lg" 
                     style={{ 
                         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                         color: 'white'
                     }}>
                    <h1 className="mb-0 d-flex align-items-center justify-content-center">
                        <FaChalkboardTeacher className="me-3" size={40} />
                        Panel de Moderador
                    </h1>
                    <p className="mb-0 mt-2 opacity-75">Dashboard de Gestión y Estadísticas</p>
                </div>
            </div>

            {/* Acciones Rápidas */}
            <Card className="mb-5 border-0 shadow-sm">
                <Card.Body className="p-4">
                    <h2 className="text-center mb-4 text-primary">
                        <FaGraduationCap className="me-2" />
                        Acciones Rápidas
                    </h2>
                    
                    <Row className="justify-content-center">
                        <Col xs={12} md={10} lg={8}>
                            <div className="d-flex justify-content-center gap-3 flex-wrap">
                                <Link to="/create-course" className="text-decoration-none">
                                    <Button 
                                        size="lg" 
                                        className="px-4 py-3 m-2 rounded-3 shadow-sm" 
                                        style={{ 
                                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                            border: 'none',
                                            minWidth: '200px'
                                        }}
                                    >
                                        <FaPlus className="me-2" /> Añadir Nuevo Curso
                                    </Button>
                                </Link>
                                <Link to="/transcriber" className="text-decoration-none">
                                    <Button 
                                        size="lg" 
                                        className="px-4 py-3 m-2 rounded-3 shadow-sm" 
                                        style={{ 
                                            background: 'linear-gradient(45deg, #11998e, #38ef7d)',
                                            border: 'none',
                                            minWidth: '200px'
                                        }}
                                    >
                                        <FaYoutube className="me-2" /> Generar Curso con IA
                                    </Button>
                                </Link>
                                <Link to="/courses-list" className="text-decoration-none">
                                    <Button 
                                        size="lg" 
                                        className="px-4 py-3 m-2 rounded-3 shadow-sm" 
                                        style={{ 
                                            background: 'linear-gradient(45deg, #ffecd2, #fcb69f)',
                                            border: 'none',
                                            color: '#333',
                                            minWidth: '200px'
                                        }}
                                    >
                                        <FaBook className="me-2" /> Gestionar Cursos
                                    </Button>
                                </Link>
                                <Link to="/users-list" className="text-decoration-none">
                                    <Button 
                                        size="lg" 
                                        className="px-4 py-3 m-2 rounded-3 shadow-sm" 
                                        style={{ 
                                            background: 'linear-gradient(45deg, #a8edea, #fed6e3)',
                                            border: 'none',
                                            color: '#333',
                                            minWidth: '200px'
                                        }}
                                    >
                                        <FaUsers className="me-2" /> Gestionar Usuarios
                                    </Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Estadísticas Principales */}
            <div className="text-center mb-4">
                <h2 className="text-primary">
                    <FaChartBar className="me-2" /> 
                    Estadísticas de la Plataforma
                </h2>
            </div>
            
            {/* Resumen de Usuarios - Tarjetas destacadas */}
            <Row className="mb-5 justify-content-center">
                <Col xs={12}>
                    <h3 className="h4 text-center mb-4 text-success">
                        <FaUsers className="me-2" /> Resumen de Usuarios
                    </h3>
                </Col>
                
                {userStats && (
                    <>
                        <Col xs={12} sm={6} lg={4} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Card.Body className="text-center text-white p-4">
                                    <FaUsers size={40} className="mb-3 opacity-75" />
                                    <h5 className="mb-2">Usuarios Totales</h5>
                                    <p className="display-4 mb-0 fw-bold">{userStats.totalUsers}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} lg={4} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                                <Card.Body className="text-center text-white p-4">
                                    <FaClock size={40} className="mb-3 opacity-75" />
                                    <h5 className="mb-2">Activos Hoy</h5>
                                    <p className="display-4 mb-0 fw-bold">{userStats.activeUsersToday}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col xs={12} sm={6} lg={4} className="mb-3">
                            <Card className="border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' }}>
                                <Card.Body className="text-center text-dark p-4">
                                    <FaTrophy size={40} className="mb-3 opacity-75" />
                                    <h5 className="mb-2">Este Mes</h5>
                                    <p className="display-4 mb-0 fw-bold">{userStats.newUsersThisMonth}</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </>
                )}
            </Row>
            
            {/* Gráficos Principales */}
            <Row className="mb-5">
                {/* Actividad de Usuarios */}
                <Col lg={8} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-gradient text-white text-center py-3" 
                                   style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}>
                            <h5 className="mb-0">
                                <FaUsers className="me-2" />
                                Actividad de Usuarios (Últimos 30 días)
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {globalStats && globalStats.dailyActiveUsers.length > 0 ? (
                                <Line 
                                    data={{
                                        labels: globalStats.dailyActiveUsers.map(u => {
                                            const date = new Date(u.date);
                                            return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
                                        }),
                                        datasets: [{
                                            label: 'Usuarios Activos',
                                            data: globalStats.dailyActiveUsers.map(u => u.count),
                                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                            borderColor: 'rgba(102, 126, 234, 1)',
                                            borderWidth: 3,
                                            tension: 0.4,
                                            fill: true,
                                            pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                                            pointBorderColor: '#fff',
                                            pointBorderWidth: 2,
                                            pointRadius: 6
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    color: 'rgba(0,0,0,0.05)'
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        }
                                    }}
                                    height={300}
                                />
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <FaChartBar size={50} className="mb-3 opacity-50" />
                                    <p>No hay datos de actividad disponibles</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                {/* Cursos Populares */}
                <Col lg={4} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-gradient text-white text-center py-3" 
                                   style={{ background: 'linear-gradient(45deg, #11998e, #38ef7d)' }}>
                            <h5 className="mb-0">
                                <FaBook className="me-2" />
                                Top Cursos
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {globalStats && globalStats.popularCourses && globalStats.popularCourses.length > 0 ? (
                                <div className="course-list">
                                    {globalStats.popularCourses.slice(0, 5).map((course, index) => (
                                        <div key={index} className="d-flex align-items-center mb-3 p-3 rounded-3" 
                                             style={{ backgroundColor: `rgba(17, 153, 142, ${0.1 - index * 0.02})` }}>
                                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3" 
                                                 style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold' }}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="mb-1" title={course.title}>
                                                    {course.title.length > 20 ? course.title.substring(0, 20) + '...' : course.title}
                                                </h6>
                                                <small className="text-muted">
                                                    <FaUsers className="me-1" />
                                                    {course.userCount} usuarios
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <FaBook size={50} className="mb-3 opacity-50" />
                                    <p>No hay datos de cursos disponibles</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            
            {/* Gráfico de Cursos Populares y Estadísticas de Exámenes */}
            <Row className="mb-5">
                <Col lg={6} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-gradient text-dark text-center py-3" 
                                   style={{ background: 'linear-gradient(45deg, #ffecd2, #fcb69f)' }}>
                            <h5 className="mb-0">
                                <FaChartBar className="me-2" />
                                Popularidad de Cursos
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {globalStats && globalStats.popularCourses && globalStats.popularCourses.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: globalStats.popularCourses.slice(0, 5).map(c => 
                                            c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title
                                        ),
                                        datasets: [{
                                            label: 'Usuarios Inscritos',
                                            data: globalStats.popularCourses.slice(0, 5).map(c => c.userCount),
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.8)',
                                                'rgba(54, 162, 235, 0.8)',
                                                'rgba(255, 205, 86, 0.8)',
                                                'rgba(75, 192, 192, 0.8)',
                                                'rgba(153, 102, 255, 0.8)'
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 205, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)'
                                            ],
                                            borderWidth: 2,
                                            borderRadius: 8
                                        }]
                                    }}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: false
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                grid: {
                                                    color: 'rgba(0,0,0,0.05)'
                                                }
                                            },
                                            x: {
                                                grid: {
                                                    display: false
                                                }
                                            }
                                        }
                                    }}
                                    height={300}
                                />
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <FaChartBar size={50} className="mb-3 opacity-50" />
                                    <p>No hay datos disponibles</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                
                <Col lg={6} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-gradient text-dark text-center py-3" 
                                   style={{ background: 'linear-gradient(45deg, #a8edea, #fed6e3)' }}>
                            <h5 className="mb-0">
                                <FaTrophy className="me-2" />
                                Estadísticas de Exámenes
                            </h5>
                        </Card.Header>
                        <Card.Body className="p-4">
                            {globalStats && globalStats.examStatistics && globalStats.examStatistics.length > 0 ? (
                                <div className="exam-stats">
                                    {globalStats.examStatistics.slice(0, 4).map((exam, index) => (
                                        <div key={index} className="mb-3 p-3 rounded-3" 
                                             style={{ backgroundColor: `rgba(168, 237, 234, ${0.2 - index * 0.03})` }}>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <h6 className="mb-0 text-dark" title={exam.title}>
                                                    {exam.title.length > 25 ? exam.title.substring(0, 25) + '...' : exam.title}
                                                </h6>
                                                <span className="badge bg-primary rounded-pill">
                                                    {Math.round(exam.passRate || exam.avgScore)}%
                                                </span>
                                            </div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <small className="text-dark">
                                                    <strong>Intentos:</strong> {exam.totalAttempts}
                                                </small>
                                                <small className="text-dark">
                                                    <strong>Aprobados:</strong> {exam.passedAttempts}
                                                </small>
                                            </div>
                                            <div className="progress bg-light" style={{ height: '10px' }}>
                                                <div 
                                                    className="progress-bar"
                                                    style={{ 
                                                        width: `${exam.passRate || exam.avgScore}%`,
                                                        background: 'linear-gradient(45deg, #667eea, #764ba2)'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted py-5">
                                    <FaTrophy size={50} className="mb-3 opacity-50" />
                                    <p>No hay datos de exámenes disponibles</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Footer del Dashboard */}
            <div className="text-center mt-5 py-4">
                <div className="d-inline-block p-3 rounded-3" style={{ backgroundColor: 'rgba(102, 126, 234, 0.1)' }}>
                    <small className="text-muted">
                        <FaChalkboardTeacher className="me-2" />
                        Dashboard actualizado automáticamente • Datos en tiempo real
                    </small>
                </div>
            </div>
        </Container>
    );
};

export default ModeratorDashboardPage;
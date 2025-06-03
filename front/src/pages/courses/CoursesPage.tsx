import React, { useState, useEffect } from 'react';
import { courseService, ICourseData } from '../../services/course/courseService';
import CourseList from '../../components/courses/CourseList';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../services/common/ErrorMessage';
import { Pagination, Form, Row, Col, Dropdown, Badge, Button } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaTimes, FaSortAmountDown, FaSortAmountUpAlt, FaFont, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const ITEMS_PER_PAGE = 6; // Or 9, or whatever you prefer

// --- NEW: Define sort options ---
const sortOptions = [
  { value: 'createdAt_desc', label: 'Más Recientes', icon: <FaSortAmountDown className="me-2"/> },
  { value: 'createdAt_asc', label: 'Más Antiguos', icon: <FaSortAmountUpAlt className="me-2"/> },
  { value: 'title_asc', label: 'Título A-Z', icon: <FaFont className="me-2"/> },
  { value: 'title_desc', label: 'Título Z-A', icon: <FaFont className="me-2 flip-horizontal"/> },
  { value: 'level_asc', label: 'Dificultad ↑', icon: <FaArrowUp className="me-2"/> },
  { value: 'level_desc', label: 'Dificultad ↓', icon: <FaArrowDown className="me-2"/> },
  // { value: 'instructor_asc', label: 'Instructor (A-Z)' }, // Podríamos añadir si se implementa populate en backend
];

// CSS Styles for dropdown and tags
const styles = {
  tagBadge: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: '8px 12px',
    fontSize: '0.85rem',
    fontWeight: 'normal',
    display: 'flex',
    alignItems: 'center'
  },
  dropdown: {
    position: 'relative' as const
  },
  dropdownMenu: {
    maxHeight: '300px',
    overflowY: 'auto' as const,
    width: '100%',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  dropdownToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    fontSize: '0.9rem'
  }
};

const CoursesPage: React.FC = () => {
    // --- Existing States ---
    const [allCourses, setAllCourses] = useState<ICourseData[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<ICourseData[]>([]);
    const [availableTags, setAvailableTags] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- NEW Pagination State ---
    const [currentPage, setCurrentPage] = useState<number>(1);

    // --- NEW: Estado para la ordenación ---
    const [sortValue, setSortValue] = useState<string>(sortOptions[0].value); // Por defecto: Más recientes

    // --- NEW: Leer instructor de la URL ---
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const instructorFilter = queryParams.get('instructor'); // null si no está

    // OPTIMIZED: Load initial data with cleanup to prevent multiple loads
    useEffect(() => {
        let isComponentMounted = true;

        const fetchCourses = async () => {
            if (!isComponentMounted) return;

            setIsLoading(true);
            setError(null);

            // --- NEW: Log the instructor filter --- 
            console.log('CoursesPage useEffect: instructorFilter =', instructorFilter);

            // --- NEW: Parse sortValue ---
            const [sortBy, sortOrder] = sortValue.split('_'); // Ej: 'createdAt_desc' -> ['createdAt', 'desc']

            try {
                // Use public courses endpoint instead of authenticated endpoint
                const coursesData = await courseService.getPublicCourses({ sortBy, sortOrder, instructor: instructorFilter ?? undefined });
                
                if (!isComponentMounted) return;

                setAllCourses(coursesData);
                setFilteredCourses(coursesData);

                // Extraer tags solo si no estamos filtrando por instructor (o de los cursos filtrados)
                if (!instructorFilter) {
                    const allTagsFromCourses = coursesData.flatMap(course => course.tags || []);
                    const uniqueTags = Array.from(new Set(allTagsFromCourses));
                    setAvailableTags(uniqueTags.sort());
                } else {
                    setAvailableTags([]); // Ocultar tags si filtramos por instructor
                }

            } catch (err) {
                if (!isComponentMounted) return;
                console.error("Error fetching courses:", err);
                setError((err as Error).message || "No se pudieron cargar los cursos.");
                setAllCourses([]);
                setFilteredCourses([]);
            } finally {
                if (isComponentMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        fetchCourses();

        return () => {
            isComponentMounted = false;
        };
    }, [sortValue, instructorFilter]);

    // OPTIMIZED: Apply Filters with memoization to prevent unnecessary recalculations
    useEffect(() => {
        let coursesToShow = [...allCourses];

        if (searchTerm.trim() !== '') {
             const lowerSearchTerm = searchTerm.toLowerCase();
             coursesToShow = coursesToShow.filter(course =>
                 course.title.toLowerCase().includes(lowerSearchTerm) ||
                 (course.description && course.description.toLowerCase().includes(lowerSearchTerm))
             );
        }

        if (selectedTags.length > 0 && !instructorFilter) {
             coursesToShow = coursesToShow.filter(course =>
                 course.tags && course.tags.some(tag => selectedTags.includes(tag))
             );
        }

        // OPTIMIZATION: Only update if the filtered courses actually changed
        setFilteredCourses(prev => {
            if (prev.length === coursesToShow.length &&
                prev.every((course, index) => course._id === coursesToShow[index]?._id)) {
                return prev; // No change, return previous state
            }
            return coursesToShow;
        });
        setCurrentPage(1);

    }, [searchTerm, selectedTags, allCourses, instructorFilter]);

    // --- NEW: Calculate pagination variables ---
    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    // Get the courses for the current page slice
    const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

    // --- NEW: Pagination handlers ---
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0); // Scroll to top on page change
    };

    // --- Renderizado ---
    return (
        <div className="container mt-4">
            {/* === NEW: Título dinámico === */}
            {instructorFilter ? (
                <h1 className="mb-4">Cursos de: <code className="fs-5 fw-normal">{instructorFilter}</code></h1>
            ) : (
                <h1 className="mb-4">Explorar Cursos</h1>
            )}

            {/* === SECCIÓN DE FILTROS Y ORDENACIÓN === */}
            <Row className="mb-4 filter-sort-bar custom-filter-bar align-items-center" style={{minHeight: 48}}>
                {/* Buscador */}
                <Col md={4} className="d-flex align-items-center justify-content-start h-100">
                    <Form.Control
                        type="text"
                        placeholder="Buscar cursos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={isLoading}
                        size="sm"
                        className="filter-input w-100"
                    />
                </Col>
                {/* Ordenación - Reemplazado Form.Select con Dropdown personalizado */}
                <Col md={4} className="d-flex align-items-center justify-content-center h-100">
                    <Dropdown className="sort-dropdown w-100">
                        <Dropdown.Toggle 
                            variant="light" 
                            id="dropdown-sort"
                            className="filter-input w-100 text-start d-flex align-items-center justify-content-between"
                        disabled={isLoading}
                        >
                            {/* Mostrar el ícono y texto de la opción seleccionada */}
                            <span className="d-flex align-items-center">
                                {sortOptions.find(opt => opt.value === sortValue)?.icon}
                                {sortOptions.find(opt => opt.value === sortValue)?.label}
                            </span>
                        </Dropdown.Toggle>

                        <Dropdown.Menu className="w-100">
                        {sortOptions.map(option => (
                                <Dropdown.Item 
                                    key={option.value} 
                                    onClick={() => setSortValue(option.value)}
                                    active={sortValue === option.value}
                                    className="d-flex align-items-center"
                                >
                                    <span className="d-flex align-items-center">
                                        {option.icon}
                                {option.label}
                                    </span>
                                </Dropdown.Item>
                        ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
                {/* Filtro de Etiquetas (Oculto si filtramos por instructor) */}
                {!instructorFilter && (
                    <Col md={4} className="d-flex align-items-center justify-content-end h-100">
                        <Dropdown className="dropdown-responsive w-100">
                                            <Dropdown.Toggle 
                                variant="light" 
                                                id="dropdown-tags"
                                className="filter-input w-100 text-start d-flex align-items-center justify-content-between"
                                disabled={isLoading}
                                            >
                                <span className="d-flex align-items-center">
                                    <FaFilter className="me-2" /> 
                                    <span>Filtrar por etiquetas</span>
                                    {selectedTags.length > 0 && <Badge bg="primary" pill className="ms-2">{selectedTags.length}</Badge>}
                                </span>
                                            </Dropdown.Toggle>
                            <Dropdown.Menu className="w-100">
                                                {availableTags.map(tag => (
                                                    <Dropdown.Item 
                                        key={tag}
                                        onClick={() => {
                                            setSelectedTags(prev =>
                                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                            );
                                        }}
                                                        active={selectedTags.includes(tag)}
                                                        className="d-flex align-items-center"
                                                    >
                                                        <div className="form-check">
                                                            <input 
                                                                type="checkbox" 
                                                                className="form-check-input" 
                                                                checked={selectedTags.includes(tag)} 
                                                                readOnly 
                                                            />
                                                            <label className="form-check-label ms-2">{tag}</label>
                                                        </div>
                                                    </Dropdown.Item>
                                                ))}
                                {selectedTags.length > 0 && <Dropdown.Divider />}
                                                {selectedTags.length > 0 && (
                                                    <Dropdown.Item 
                                                        className="text-danger"
                                                        onClick={() => setSelectedTags([])}
                                                    >
                                                        <FaTimes className="me-2" /> Limpiar selección
                                                    </Dropdown.Item>
                                                )}
                                            </Dropdown.Menu>
                                        </Dropdown>
                    </Col>
                )}
            </Row>
            {/* === FIN SECCIÓN === */}

            {/* --- Lógica de Display --- */}
            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}

            {!isLoading && !error && (
                <>
                    {currentCourses.length > 0 ? (
                        <CourseList courses={currentCourses} />
                    ) : (
                        <div className="text-center text-muted py-5"><p>No se encontraron cursos con los filtros actuales.</p></div>
                    )}

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                <Pagination.Prev
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                />
                                <Pagination.Item active>{currentPage}</Pagination.Item>
                                <Pagination.Next
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            )}
             {/* Informational text if needed */}
             { !isLoading && !error && filteredCourses.length > 0 && totalPages > 1 && (
                 <p className="text-center text-muted mt-2 small">
                    Mostrando {currentCourses.length} de {filteredCourses.length} cursos (Página {currentPage} de {totalPages})
                 </p>
             )}

        </div>
    );
};

export default CoursesPage;

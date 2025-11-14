import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../components/common/ToastContainer';
import ConfirmModal from '../../components/common/ConfirmModal';
import Semaforo, { mapEstadoToSemaforo } from '../../components/common/Semaforo';
import { MdSearch, MdRefresh, MdVisibility, MdEdit, MdDelete, MdClose, MdPictureAsPdf, MdAssignment, MdPriorityHigh, MdPerson, MdNotes, MdInfo, MdCheckCircle, MdArrowForward, MdPublic, MdPublicOff, MdFilterList, MdCategory, MdSort, MdDateRange } from 'react-icons/md';
import { comunicacionService } from '../../services/comunicacionService';
import { seguimientoService } from '../../services/seguimientoService';
import { estadoService } from '../../services/estadoService';
import { historialEstadoService } from '../../services/historialEstadoService';
import { categoriaService } from '../../services/categoriaService';
import { evidenciaService } from '../../services/evidenciaService';
import { usuarioService } from '../../services/usuarioService';
import { API_BASE_URL } from '../../config/api';
import jsPDF from 'jspdf';
import type { Comunicacion, Estado, Seguimiento, HistorialEstado, Categoria, Evidencia, Usuario } from '../../types';
import logoIzquierdo from '../../assets/img/logosuperiorizquiero.png';
import logoDerecho from '../../assets/img/logosuperiorderecho.png';
import './GestionComunicaciones.css';

interface ComunicacionConEstado extends Comunicacion {
  estado?: Estado;
  seguimiento?: Seguimiento;
  responsable?: string;
}

const GestionReconocimientos = () => {
  const { showToast } = useToast();
  const [comunicaciones, setComunicaciones] = useState<ComunicacionConEstado[]>([]);
  const [filteredComunicaciones, setFilteredComunicaciones] = useState<ComunicacionConEstado[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [comunicacionToDelete, setComunicacionToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('Activas'); // Por defecto mostrar solo activas (excluye cerradas)
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [ordenPor, setOrdenPor] = useState<'fecha' | 'folio' | 'estado'>('fecha');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  
  // Modal states
  const [selectedComunicacion, setSelectedComunicacion] = useState<ComunicacionConEstado | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'estado'>('view');
  const [historialEstados, setHistorialEstados] = useState<HistorialEstado[]>([]);
  const [nuevoEstado, setNuevoEstado] = useState<number>(1);
  const [nuevoResponsable, setNuevoResponsable] = useState('');
  const [nuevasNotas, setNuevasNotas] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'Baja' | 'Media' | 'Alta' | 'Urgente'>('Media');
  const [mostrarPublico, setMostrarPublico] = useState(false);
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [usuarioComunicacion, setUsuarioComunicacion] = useState<Usuario | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterComunicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterEstado, filterCategoria, fechaDesde, fechaHasta, ordenPor, ordenDireccion, comunicaciones]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Cargando datos de reconocimientos...');
      const [comData, estadosData, categoriasData] = await Promise.all([
        comunicacionService.getAll(),
        estadoService.getAll(),
        categoriaService.getAll()
      ]);
      
      console.log('✅ Datos cargados:', {
        comunicaciones: comData.length,
        estados: estadosData.length,
        categorias: categoriasData.length
      });
      
      setCategorias(categoriasData);
      
      const reconocimientos = comData.filter((c: Comunicacion) => c.tipo === 'Reconocimiento');
      console.log('📋 Reconocimientos encontrados:', reconocimientos.length);
      
      // Cargar seguimientos para cada comunicación
      const reconocimientosConEstado = await Promise.all(
        reconocimientos.map(async (reconocimiento: Comunicacion) => {
          try {
            const seguimiento = await seguimientoService.getByComunicacionId(reconocimiento.id_comunicacion!);
            if (seguimiento) {
              const estado = estadosData.find((e: Estado) => e.id_estado === seguimiento.id_estado);
              return {
                ...reconocimiento,
                estado,
                seguimiento,
                responsable: seguimiento.responsable || 'Sin asignar'
              };
            }
            return {
              ...reconocimiento,
              estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente'),
              responsable: 'Sin asignar'
            };
          } catch (err) {
            console.warn(`⚠️ Error al cargar seguimiento para comunicación ${reconocimiento.id_comunicacion}:`, err);
            return {
              ...reconocimiento,
              estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente'),
              responsable: 'Sin asignar'
            };
          }
        })
      );
      
      console.log('✅ Reconocimientos procesados:', reconocimientosConEstado.length);
      setComunicaciones(reconocimientosConEstado);
      setFilteredComunicaciones(reconocimientosConEstado);
      setEstados(estadosData);
      setError(null);
    } catch (error: unknown) {
      console.error('❌ Error al cargar datos:', error);
      let errorMessage = 'Error al cargar los reconocimientos. Verifica que el backend esté corriendo en http://localhost:3000';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        }
      }
      
      setError(errorMessage);
      setComunicaciones([]);
      setFilteredComunicaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const filterComunicaciones = () => {
    const filtered = comunicaciones.filter((c: ComunicacionConEstado) => {
      const matchesSearch = 
        c.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Lógica de filtro por estado
      let matchesEstado = true;
      if (filterEstado === 'Activas') {
        // Mostrar solo comunicaciones activas (excluir cerradas)
        matchesEstado = c.estado?.nombre_estado !== 'Cerrada';
      } else if (filterEstado === 'Todos') {
        // Mostrar todas, incluyendo cerradas
        matchesEstado = true;
      } else {
        // Filtrar por estado específico
        matchesEstado = c.estado?.nombre_estado === filterEstado;
      }
      
      const matchesCategoria = filterCategoria === 'Todas' || 
        c.id_categoria === Number(filterCategoria);
      
      // Filtro por rango de fechas
      let matchesFecha = true;
      if (fechaDesde || fechaHasta) {
        if (c.fecha_recepcion) {
          const fechaCom = new Date(c.fecha_recepcion);
          if (fechaDesde) {
            const desde = new Date(fechaDesde);
            desde.setHours(0, 0, 0, 0);
            if (fechaCom < desde) matchesFecha = false;
          }
          if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999);
            if (fechaCom > hasta) matchesFecha = false;
          }
        } else {
          matchesFecha = false;
        }
      }
      
      return matchesSearch && matchesEstado && matchesCategoria && matchesFecha;
    });

    // Ordenamiento
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      switch (ordenPor) {
        case 'fecha':
          aValue = a.fecha_recepcion ? new Date(a.fecha_recepcion).getTime() : 0;
          bValue = b.fecha_recepcion ? new Date(b.fecha_recepcion).getTime() : 0;
          break;
        case 'folio':
          aValue = a.folio || '';
          bValue = b.folio || '';
          break;
        case 'estado':
          aValue = a.estado?.nombre_estado || '';
          bValue = b.estado?.nombre_estado || '';
          break;
        default:
          return 0;
      }
      
      if (ordenPor === 'fecha' || ordenPor === 'folio' || ordenPor === 'estado') {
        if (ordenDireccion === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      }
      
      return 0;
    });

    setFilteredComunicaciones(sorted);
  };

  const getEstadoBadge = (comunicacion: ComunicacionConEstado) => {
    const estadoNombre = comunicacion.estado?.nombre_estado || 'Pendiente';
    const estadoClass = estadoNombre.toLowerCase().replace(' ', '-');
    return <span className={`badge badge-${estadoClass}`}>{estadoNombre}</span>;
  };

  const getEstadoSemaforo = (comunicacion: ComunicacionConEstado) => {
    const estadoNombre = comunicacion.estado?.nombre_estado || 'Pendiente';
    const estadoSemaforo = mapEstadoToSemaforo(estadoNombre);
    return <Semaforo estado={estadoSemaforo} showLabel={true} size="small" className="horizontal" />;
  };

  const handleVer = async (comunicacion: ComunicacionConEstado) => {
    setSelectedComunicacion(comunicacion);
    setModalMode('view');
    setShowModal(true);
    
    // Cargar historial de estados, evidencias y usuario
    if (comunicacion.id_comunicacion) {
      try {
        const [historial, evidenciasData] = await Promise.all([
          historialEstadoService.getByComunicacionId(comunicacion.id_comunicacion),
          evidenciaService.getByComunicacionId(comunicacion.id_comunicacion),
        ]);
        setHistorialEstados(historial);
        
        // Filtrar evidencias: solo mostrar las subidas por el usuario, NO los PDFs generados
        // Los PDFs generados tienen patrones específicos en el nombre:
        // - "formato_" (nuevos)
        // - Patrones con fecha como "25_2025-11-14.pdf" (antiguos)
        const evidenciasUsuario = evidenciasData.filter((ev: Evidencia) => {
          const nombreArchivo = ev.nombre_archivo?.toLowerCase() || '';
          // Excluir PDFs generados:
          // 1. Los que empiezan con "formato_"
          // 2. Los que tienen patrón de fecha al final (ej: "25_2025-11-14.pdf")
          // 3. Los que son solo números seguidos de fecha (ej: "25_2025-11-14.pdf")
          const esPDFGenerado = nombreArchivo.startsWith('formato_') || 
                                /^\d+_\d{4}-\d{2}-\d{2}\.pdf$/.test(nombreArchivo) ||
                                /^formato_.*\.pdf$/.test(nombreArchivo);
          return !esPDFGenerado;
        });
        setEvidencias(evidenciasUsuario);

        // Cargar datos del usuario si existe
        if (comunicacion.id_usuario) {
          try {
            const usuario = await usuarioService.getById(comunicacion.id_usuario);
            setUsuarioComunicacion(usuario);
          } catch (error) {
            console.error('Error al cargar usuario:', error);
            setUsuarioComunicacion(null);
          }
        } else {
          setUsuarioComunicacion(null);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setHistorialEstados([]);
        setEvidencias([]);
        setUsuarioComunicacion(null);
      }
    }
  };

  // Función helper para cargar imagen y convertir a base64
  const loadImageAsBase64 = (imagePath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          try {
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No se pudo obtener el contexto del canvas'));
        }
      };
      img.onerror = reject;
      img.src = imagePath;
    });
  };

  const descargarPDFComunicacion = async () => {
    if (!selectedComunicacion) return;

    try {
      setGenerandoPDF(true);
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = margin;
      const lineHeight = 8; // Aumentado para mejor legibilidad

      // Colores profesionales mejorados
      const colorAzulOscuro: [number, number, number] = [25, 45, 99]; // #192d63 - Azul institucional
      const colorAzulClaro: [number, number, number] = [41, 128, 185]; // #2980b9 - Azul profesional
      const colorGrisOscuro: [number, number, number] = [44, 62, 80]; // #2c3e50 - Gris profesional
      const colorGrisClaro: [number, number, number] = [108, 117, 125]; // #6c757d - Gris suave
      const colorNegro: [number, number, number] = [33, 37, 41]; // #212529 - Negro suave
      const colorBlanco: [number, number, number] = [255, 255, 255];

      // Cargar logos como base64
      let logoIzquierdoBase64: string | null = null;
      let logoDerechoBase64: string | null = null;
      
      try {
        logoIzquierdoBase64 = await loadImageAsBase64(logoIzquierdo);
        logoDerechoBase64 = await loadImageAsBase64(logoDerecho);
      } catch (error) {
        console.warn('Error al cargar logos para PDF:', error);
      }

      // Header con logos - mantener proporción original
      const headerY = 10; // Posición Y del header
      const maxLogoHeight = 20; // Altura máxima de los logos en mm
      const maxLogoWidth = 45; // Ancho máximo de los logos en mm

      // Logo izquierdo - mantener proporción
      if (logoIzquierdoBase64) {
        try {
          const img = new Image();
          img.src = logoIzquierdoBase64;
          await new Promise((resolve) => {
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let logoWidth = maxLogoWidth;
              let logoHeight = maxLogoWidth / aspectRatio;
              
              // Si la altura excede el máximo, ajustar
              if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = maxLogoHeight * aspectRatio;
              }
              
              doc.addImage(logoIzquierdoBase64, 'PNG', margin, headerY, logoWidth, logoHeight);
              resolve(null);
            };
            img.onerror = resolve; // Continuar aunque falle
          });
        } catch (error) {
          console.warn('Error al agregar logo izquierdo:', error);
        }
      }

      // Logo derecho - mantener proporción
      if (logoDerechoBase64) {
        try {
          const img = new Image();
          img.src = logoDerechoBase64;
          await new Promise((resolve) => {
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let logoWidth = maxLogoWidth;
              let logoHeight = maxLogoWidth / aspectRatio;
              
              // Si la altura excede el máximo, ajustar
              if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = maxLogoHeight * aspectRatio;
              }
              
              doc.addImage(logoDerechoBase64, 'PNG', pageWidth - margin - logoWidth, headerY, logoWidth, logoHeight);
              resolve(null);
            };
            img.onerror = resolve; // Continuar aunque falle
          });
        } catch (error) {
          console.warn('Error al agregar logo derecho:', error);
        }
      }
      
      // Calcular altura máxima de logos para posicionar el título
      const logoHeight = maxLogoHeight;

      // Título principal (centrado entre los logos)
      yPosition = headerY + logoHeight + 10; // Espacio después de los logos
      doc.setFontSize(16);
      doc.setTextColor(...colorAzulOscuro);
      doc.setFont('helvetica', 'bold');
      doc.text('FORMATO DE QUEJAS, SUGERENCIAS Y RECONOCIMIENTOS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 1.2;
      
      doc.setFontSize(14);
      doc.setTextColor(...colorAzulClaro);
      doc.text('FORMATO DE RECONOCIMIENTOS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Línea decorativa
      doc.setDrawColor(...colorAzulOscuro);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Folio con estilo mejorado
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Folio:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      doc.text(selectedComunicacion.folio || 'N/A', margin + 25, yPosition);
      yPosition += lineHeight * 2;

      // DATOS DEL REMITENTE con fondo destacado
      doc.setFillColor(...colorAzulOscuro);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorBlanco);
      doc.text('DATOS DEL REMITENTE', margin + 2, yPosition);
      yPosition += lineHeight * 1.8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      
      // Verificar si es confidencial o anónima
      const esConfidencial = usuarioComunicacion?.confidencial || !selectedComunicacion.id_usuario;
      
      if (esConfidencial) {
        // Si es confidencial, no mostrar datos personales
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text('Comunicación Confidencial/Anónima', margin + 20, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...colorGrisClaro);
        doc.text('Los datos personales del remitente han sido ocultados por solicitud de confidencialidad.', margin, yPosition, { maxWidth: pageWidth - (margin * 2) });
        doc.setTextColor(...colorNegro);
        yPosition += lineHeight * 1.5;
      } else if (usuarioComunicacion) {
        // Si no es confidencial, mostrar todos los datos
        doc.setFont('helvetica', 'bold');
        doc.text('Nombre (Opcional):', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.nombre || 'No proporcionado', margin + 50, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Correo electrónico:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.correo || 'N/A', margin + 50, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Semestre/área de adscripción:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        const semestreArea = usuarioComunicacion.semestre_area || 'N/A';
        const semestreAreaLines = doc.splitTextToSize(semestreArea, pageWidth - (margin * 2) - 50);
        semestreAreaLines.forEach((line: string, index: number) => {
          doc.text(line, margin + 50, yPosition + (index * lineHeight));
        });
        yPosition += (semestreAreaLines.length * lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.text('Teléfono (opcional):', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.telefono || 'N/A', margin + 50, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo de usuario:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.tipo_usuario || 'N/A', margin + 50, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Sexo:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.sexo || 'N/A', margin + 50, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Confidencial:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.confidencial ? 'Sí' : 'No', margin + 50, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Autorizo contacto:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(usuarioComunicacion.autorizo_contacto ? 'Sí' : 'No', margin + 50, yPosition);
        yPosition += lineHeight * 1.5;
      } else {
        doc.text('Usuario no identificado o comunicación anónima', margin, yPosition);
        yPosition += lineHeight * 1.5;
      }

      // TIPO DE COMUNICACIÓN con fondo destacado
      doc.setFillColor(...colorAzulOscuro);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorBlanco);
      doc.text('TIPO DE COMUNICACIÓN', margin + 2, yPosition);
      yPosition += lineHeight * 1.8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      doc.setFont('helvetica', 'bold');
      doc.text('Tipo:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedComunicacion.tipo || 'N/A', margin + 20, yPosition);
      yPosition += lineHeight;

      const categoria = categorias.find(c => c.id_categoria === selectedComunicacion.id_categoria);
      doc.setFont('helvetica', 'bold');
      doc.text('Categoría:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(categoria?.nombre_categoria || 'N/A', margin + 30, yPosition);
      yPosition += lineHeight * 1.5;

      // DETALLES DE LA QUEJA O SUGERENCIA con fondo destacado
      doc.setFillColor(...colorAzulOscuro);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorBlanco);
      doc.text('DETALLES DE LA QUEJA O SUGERENCIA', margin + 2, yPosition);
      yPosition += lineHeight * 1.8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      
      // Asunto (resumen de la descripción)
      const asunto = selectedComunicacion.descripcion 
        ? (selectedComunicacion.descripcion.length > 80 
            ? selectedComunicacion.descripcion.substring(0, 80) + '...' 
            : selectedComunicacion.descripcion)
        : 'N/A';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Asunto:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorAzulClaro);
      const asuntoLines = doc.splitTextToSize(asunto, pageWidth - (margin * 2) - 25);
      asuntoLines.forEach((line: string, index: number) => {
        doc.text(line, margin + 25, yPosition + (index * lineHeight));
      });
      yPosition += (asuntoLines.length * lineHeight) + lineHeight * 0.5;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Fecha:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      const fechaFormateada = selectedComunicacion.fecha_recepcion 
        ? new Date(selectedComunicacion.fecha_recepcion).toLocaleDateString('es-MX')
        : 'N/A';
      doc.text(fechaFormateada, margin + 25, yPosition);
      yPosition += lineHeight * 1.2;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Área involucrada:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      doc.text(selectedComunicacion.area_involucrada || 'N/A', margin + 45, yPosition);
      yPosition += lineHeight * 1.5;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Descripción de hechos:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      const descripcionLines = doc.splitTextToSize(selectedComunicacion.descripcion || 'N/A', pageWidth - (margin * 2));
      descripcionLines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight * 0.8;

      // NOTA: Los reconocimientos NO tienen propuesta de mejora, así que omitimos esa sección

      // EVIDENCIA con fondo destacado
      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFillColor(...colorAzulOscuro);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorBlanco);
      doc.text('EVIDENCIA (Opcional)', margin + 2, yPosition);
      yPosition += lineHeight * 1.8;

      if (evidencias.length > 0) {
        // Lista de evidencias adjuntas
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colorNegro);
        doc.text(`Se adjuntan ${evidencias.length} evidencia(s):`, margin, yPosition);
        yPosition += lineHeight * 1.2;

        evidencias.forEach((evidencia, index) => {
          if (yPosition > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(...colorGrisOscuro);
          doc.text(`${index + 1}.`, margin + 5, yPosition);
          
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...colorNegro);
          doc.text(`${evidencia.nombre_archivo} (${evidencia.tipo_archivo})`, margin + 12, yPosition);
          yPosition += lineHeight;
        });

        yPosition += lineHeight * 0.5;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...colorGrisClaro);
        doc.setFontSize(11);
        doc.text('Nota: Las evidencias están disponibles para descarga en el sistema.', margin, yPosition, { maxWidth: pageWidth - (margin * 2) });
        yPosition += lineHeight * 1.2;
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colorNegro);
        doc.text('No se adjunta evidencia', margin, yPosition);
        yPosition += lineHeight;
      }

      // Sección de FIRMA eliminada - no se puede firmar digitalmente

      // Generar PDF como Blob
      const fileName = `formato_${selectedComunicacion.folio || selectedComunicacion.id_comunicacion}_${new Date().toISOString().split('T')[0]}.pdf`;
      const pdfBlob = doc.output('blob');
      
      // Descargar PDF localmente
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Guardar PDF en el servidor para que el admin pueda descargarlo desde cualquier computadora
      // NOTA: Este PDF se guardará como evidencia pero será filtrado de la lista "Evidencias Adjuntas"
      // para que solo muestre los archivos subidos por el usuario
      if (selectedComunicacion.id_comunicacion) {
        try {
          await evidenciaService.uploadPDF(selectedComunicacion.id_comunicacion, pdfBlob, fileName);
          showToast('PDF descargado y guardado en el servidor', 'success');
        } catch (uploadError) {
          console.warn('PDF descargado localmente, pero no se pudo guardar en el servidor:', uploadError);
          showToast('PDF descargado. No se pudo guardar en el servidor', 'warning');
        }
      } else {
        showToast('PDF descargado exitosamente', 'success');
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      showToast('Error al generar el PDF del formato', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const handleCambiarEstado = (comunicacion: ComunicacionConEstado) => {
    setSelectedComunicacion(comunicacion);
    setNuevoEstado(comunicacion.estado?.id_estado || 1);
    setNuevoResponsable(comunicacion.responsable || '');
    setNuevasNotas('');
    // Para reconocimientos, siempre usar "Baja" (aunque no se muestre)
    // Para quejas/sugerencias, usar la prioridad existente o "Media" por defecto
    setNuevaPrioridad(
      comunicacion.tipo === 'Reconocimiento' 
        ? 'Baja' 
        : ((comunicacion.seguimiento?.prioridad as 'Baja' | 'Media' | 'Alta' | 'Urgente') || 'Media')
    );
    setMostrarPublico(comunicacion.mostrar_publico || false);
    setModalMode('estado');
    setShowModal(true);
  };

  const handleEliminar = async (id: number) => {
    setComunicacionToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmEliminar = async () => {
    if (comunicacionToDelete) {
      try {
        await comunicacionService.delete(comunicacionToDelete);
        loadData();
        showToast('Comunicación eliminada exitosamente', 'success');
      } catch (error) {
        console.error('Error al eliminar:', error);
        showToast('Error al eliminar la comunicación', 'error');
      } finally {
        setShowDeleteConfirm(false);
        setComunicacionToDelete(null);
      }
    }
  };

  const handleGuardarEstado = async () => {
    if (!selectedComunicacion) return;
    
    // Validar que las notas sean obligatorias si el estado es "Atendida" o "Cerrada"
    const estadoSeleccionado = estados.find(e => e.id_estado === nuevoEstado);
    const nombreEstado = estadoSeleccionado?.nombre_estado || 'Estado';
    const requiereNotas = nombreEstado === 'Atendida' || nombreEstado === 'Cerrada';
    
    if (requiereNotas && (!nuevasNotas || nuevasNotas.trim().length === 0)) {
      showToast('⚠️ Las notas son obligatorias cuando el estado es "Atendida" o "Cerrada", ya que serán visibles para el usuario.', 'error');
      return;
    }
    
    try {
      // Para reconocimientos, la prioridad siempre es "Baja" (no se muestra al usuario)
      const prioridadFinal = selectedComunicacion.tipo === 'Reconocimiento' ? 'Baja' : nuevaPrioridad;
      
      // Crear o actualizar seguimiento
      if (selectedComunicacion.seguimiento?.id_seguimiento) {
        await seguimientoService.update(selectedComunicacion.seguimiento.id_seguimiento, {
          id_estado: nuevoEstado,
          responsable: nuevoResponsable,
          notas: nuevasNotas,
          prioridad: prioridadFinal,
        });
      } else {
        await seguimientoService.create({
          id_comunicacion: selectedComunicacion.id_comunicacion!,
          id_estado: nuevoEstado,
          responsable: nuevoResponsable,
          notas: nuevasNotas,
          prioridad: prioridadFinal,
        });
      }
      
      // Crear registro en historial
      await historialEstadoService.create({
        id_comunicacion: selectedComunicacion.id_comunicacion!,
        id_estado: nuevoEstado,
        responsable: nuevoResponsable,
        notas: nuevasNotas,
      });
      
      // Actualizar mostrar_publico si es un reconocimiento
      if (selectedComunicacion.tipo === 'Reconocimiento') {
        await comunicacionService.update(selectedComunicacion.id_comunicacion!, {
          mostrar_publico: mostrarPublico
        });
      }
      
      // Cerrar modal primero
      setShowModal(false);
      
      // Recargar datos
      await loadData();
      
      // Mostrar mensaje específico si se cerró
      if (nombreEstado === 'Cerrada') {
        showToast('✅ Comunicación cerrada. Ya no aparecerá en las listas activas por defecto. Puedes verla seleccionando "Cerradas" en el filtro o consultándola por folio.', 'success');
      } else {
        showToast(`✅ Estado actualizado a "${nombreEstado}" correctamente`, 'success');
      }
    } catch (error: unknown) {
      console.error('Error al guardar estado:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { message?: string })?.message || 
                          'Error al guardar el estado';
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  return (
    <AdminLayout>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de eliminar esta comunicación? Esta acción no se puede deshacer."
        type="danger"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmEliminar}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setComunicacionToDelete(null);
        }}
      />
      <div className="gestion-container">
        <div className="gestion-header">
          <div>
            <h1>Felicitaciones y Reconocimientos</h1>
            <p>Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV</p>
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#e7f3ff', 
              borderRadius: '6px', 
              borderLeft: '4px solid #2196F3',
              fontSize: '0.9rem',
              color: '#1976D2'
            }}>
              <strong>Nota:</strong> Los reconocimientos son mensajes positivos para destacar el buen trabajo, acciones positivas o logros de miembros de la comunidad. 
              Puede seleccionar qué reconocimientos mostrar públicamente marcando la opción "Mostrar en la página pública" al cambiar el estado. 
              Solo los reconocimientos seleccionados aparecerán en la página de Felicitaciones y Reconocimientos para los usuarios.
            </div>
          </div>
        </div>

        <div className="filtros-section">
          <div className="filtros-content">
            <div className="search-group">
              <input
                type="text"
                placeholder="Buscar por folio, asunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button className="btn-filter">
                <MdSearch className="btn-icon" />
                Buscar
              </button>
            </div>
            <div className="filtros-selects">
              <div className="filter-group">
                <label className="filter-label">
                  <MdFilterList className="filter-icon" />
                  Estado
                </label>
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="filter-select">
                  <option value="Activas">Activas (sin cerradas)</option>
                  <option value="Todos">Todos (incluye cerradas)</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Atendida">Atendida</option>
                  <option value="Cerrada">Cerradas</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">
                  <MdCategory className="filter-icon" />
                  Categoría
                </label>
                <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="filter-select">
                  <option>Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">
                  <MdSort className="filter-icon" />
                  Ordenar por
                </label>
                <select value={ordenPor} onChange={(e) => setOrdenPor(e.target.value as 'fecha' | 'folio' | 'estado')} className="filter-select">
                  <option value="fecha">Fecha</option>
                  <option value="folio">Folio</option>
                  <option value="estado">Estado</option>
                </select>
              </div>
              <div className="filter-group">
                <label className="filter-label">
                  <MdSort className="filter-icon" />
                  Dirección
                </label>
                <select value={ordenDireccion} onChange={(e) => setOrdenDireccion(e.target.value as 'asc' | 'desc')} className="filter-select">
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
            <div className="filtros-fechas">
              <div className="filter-group">
                <label className="filter-label">
                  <MdDateRange className="filter-icon" />
                  Rango de fechas
                </label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="date-input"
                    placeholder="Desde"
                  />
                  <span className="date-separator">-</span>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="date-input"
                    placeholder="Hasta"
                  />
                  {(fechaDesde || fechaHasta) && (
                    <button 
                      className="btn-clear-filters"
                      onClick={() => {
                        setFechaDesde('');
                        setFechaHasta('');
                      }}
                      title="Limpiar filtros de fecha"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button className="btn-secondary-small" onClick={loadData}>
              <MdRefresh className="btn-icon" />
              Actualizar
            </button>
          </div>
        </div>

        <div className="tabla-section">
          <div className="tabla-header">
            <h2>Lista de Reconocimientos</h2>
          </div>

          {loading ? (
            <div className="loading-message">
              <div>Cargando reconocimientos...</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
                Por favor espera mientras se cargan los datos
              </div>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#c82333' }}>
                Verifica que el backend esté corriendo en http://localhost:3000
              </div>
              <button className="btn-primary" onClick={loadData} style={{ marginTop: '1.5rem' }}>
                <MdRefresh className="btn-icon" />
                Intentar Nuevamente
              </button>
            </div>
          ) : filteredComunicaciones.length === 0 ? (
            <div className="empty-message">
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.2rem' }}>
                {comunicaciones.length === 0 
                  ? 'No hay reconocimientos registrados en el sistema'
                  : 'No se encontraron reconocimientos con los filtros aplicados'}
              </div>
              {comunicaciones.length === 0 && (
                <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.5rem' }}>
                  Los reconocimientos aparecerán aquí cuando los usuarios los envíen
                </div>
              )}
            </div>
          ) : (
            <div className="tabla-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha</th>
                    <th>Remitente</th>
                    <th>Asunto</th>
                    <th>Estado</th>
                    <th>Público</th>
                    <th>Asignado a</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComunicaciones.map((comunicacion) => (
                    <tr key={comunicacion.id_comunicacion}>
                      <td className="folio-cell">{comunicacion.folio}</td>
                      <td>
                        {comunicacion.fecha_recepcion
                          ? new Date(comunicacion.fecha_recepcion).toLocaleDateString('es-MX')
                          : '-'}
                      </td>
                      <td>Anónimo</td>
                      <td className="asunto-cell">
                        {comunicacion.descripcion.substring(0, 50)}...
                      </td>
                      <td>{getEstadoSemaforo(comunicacion)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {comunicacion.mostrar_publico ? (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            color: '#2196F3',
                            fontWeight: 'bold'
                          }} title="Visible públicamente">
                            <MdPublic /> Público
                          </span>
                        ) : (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            color: '#999',
                            fontWeight: 'normal'
                          }} title="No visible públicamente">
                            <MdPublicOff /> Privado
                          </span>
                        )}
                      </td>
                      <td>{comunicacion.responsable || 'Sin asignar'}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-action" title="Ver" onClick={() => handleVer(comunicacion)}>
                            <MdVisibility />
                          </button>
                          <button className="btn-action" title="Cambiar Estado" onClick={() => handleCambiarEstado(comunicacion)}>
                            <MdEdit />
                          </button>
                          <button className="btn-action btn-danger" title="Eliminar" onClick={() => handleEliminar(comunicacion.id_comunicacion!)}>
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showModal && selectedComunicacion && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {modalMode === 'view' && 'Detalles del Reconocimiento'}
                  {modalMode === 'estado' && 'Cambiar Estado'}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {modalMode === 'view' && (
                    <button 
                      className="btn-download-pdf"
                      onClick={descargarPDFComunicacion}
                      disabled={generandoPDF}
                      title="Descargar formato en PDF"
                    >
                      <MdPictureAsPdf />
                      {generandoPDF ? 'Generando...' : 'Descargar PDF'}
                    </button>
                  )}
                  <button className="modal-close" onClick={() => setShowModal(false)}>
                    <MdClose />
                  </button>
                </div>
              </div>
              <div className="modal-body">
                {modalMode === 'view' && (
                  <>
                    <div className="modal-section">
                      <div className="modal-info-row">
                        <span className="modal-label">Folio:</span>
                        <span className="modal-value">{selectedComunicacion.folio}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Tipo:</span>
                        <span className="modal-value">{selectedComunicacion.tipo}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Fecha de Recepción:</span>
                        <span className="modal-value">
                          {selectedComunicacion.fecha_recepcion
                            ? new Date(selectedComunicacion.fecha_recepcion).toLocaleDateString('es-MX')
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Estado Actual:</span>
                        <span className="modal-value">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {getEstadoSemaforo(selectedComunicacion)}
                            {getEstadoBadge(selectedComunicacion)}
                          </div>
                        </span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Responsable:</span>
                        <span className="modal-value">{selectedComunicacion.responsable || 'Sin asignar'}</span>
                      </div>
                      {selectedComunicacion.area_involucrada && (
                        <div className="modal-info-row">
                          <span className="modal-label">Área Involucrada:</span>
                          <span className="modal-value">{selectedComunicacion.area_involucrada}</span>
                        </div>
                      )}
                      <div className="modal-info-row full-width">
                        <span className="modal-label">Descripción:</span>
                        <div className="modal-description">
                          {selectedComunicacion.descripcion}
                        </div>
                      </div>
                    </div>

                    {/* Datos del Remitente - Solo si NO es confidencial */}
                    {usuarioComunicacion && !usuarioComunicacion.confidencial && selectedComunicacion.id_usuario ? (
                      <div className="modal-section">
                        <h3>Datos del Remitente</h3>
                        <div className="modal-info-row">
                          <strong>Nombre:</strong>
                          <span>{usuarioComunicacion.nombre || 'No proporcionado'}</span>
                        </div>
                        <div className="modal-info-row">
                          <strong>Correo:</strong>
                          <span>{usuarioComunicacion.correo || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                          <strong>Teléfono:</strong>
                          <span>{usuarioComunicacion.telefono || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                          <strong>Semestre/Área:</strong>
                          <span>{usuarioComunicacion.semestre_area || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                          <strong>Tipo de Usuario:</strong>
                          <span>{usuarioComunicacion.tipo_usuario || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                          <strong>Sexo:</strong>
                          <span>{usuarioComunicacion.sexo || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                          <strong>Autoriza Contacto:</strong>
                          <span>{usuarioComunicacion.autorizo_contacto ? 'Sí' : 'No'}</span>
                        </div>
                      </div>
                    ) : (selectedComunicacion.id_usuario || usuarioComunicacion?.confidencial) && (
                      <div className="modal-section">
                        <h3>Datos del Remitente</h3>
                        <div className="modal-info-row">
                          <strong>Tipo:</strong>
                          <span style={{ fontStyle: 'italic', color: '#666' }}>
                            Comunicación Confidencial/Anónima
                          </span>
                        </div>
                        <div className="modal-info-row">
                          <p style={{ fontStyle: 'italic', color: '#666', margin: '0.5rem 0' }}>
                            Los datos personales del remitente han sido ocultados por solicitud de confidencialidad.
                          </p>
                        </div>
                      </div>
                    )}

                    {evidencias.length > 0 && (
                      <div className="modal-section">
                        <h3>Evidencias Adjuntas ({evidencias.length})</h3>
                        <div className="evidencias-list">
                          {evidencias.map((evidencia) => {
                            const fileUrl = `${API_BASE_URL}/evidencias/${evidencia.id_evidencia}/download`;
                            const fileSizeMB = evidencia.tamano_bytes ? (evidencia.tamano_bytes / 1024 / 1024).toFixed(2) : '0';
                            return (
                              <div key={evidencia.id_evidencia} className="evidencia-item">
                                <div className="evidencia-info">
                                  <strong>{evidencia.nombre_archivo}</strong>
                                  <span className="evidencia-meta">
                                    {evidencia.tipo_archivo} • {fileSizeMB} MB
                                  </span>
                                </div>
                                <a
                                  href={fileUrl}
                                  download={evidencia.nombre_archivo}
                                  className="btn-download-evidencia"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Descargar
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {historialEstados.length > 0 && (
                      <div className="modal-section">
                        <h3>Historial de Estados</h3>
                        <div className="historial-list">
                          {historialEstados.map((historial) => {
                            const estado = estados.find(e => e.id_estado === historial.id_estado);
                            return (
                              <div key={historial.id_historial} className="historial-item">
                                <div className="historial-header">
                                  <strong>{estado?.nombre_estado || 'N/A'}</strong>
                                  <span className="historial-date">
                                    {new Date(historial.fecha_actualizacion!).toLocaleString('es-MX')}
                                  </span>
                                </div>
                                {historial.responsable && (
                                  <div className="historial-responsable">Responsable: {historial.responsable}</div>
                                )}
                                {historial.notas && (
                                  <div className="historial-notas">{historial.notas}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {modalMode === 'estado' && (
                  <div className="modal-section">
                    {/* Preview del cambio de estado */}
                    {selectedComunicacion && (
                      <div className="estado-preview-card">
                        <div className="preview-header">
                          <MdInfo className="preview-icon" />
                          <span>Cambio de Estado</span>
                        </div>
                        <div className="preview-content">
                          <div className="preview-item">
                            <span className="preview-label">Estado Actual:</span>
                            <span className={`badge badge-${selectedComunicacion.estado?.nombre_estado?.toLowerCase().replace(' ', '-') || 'pendiente'}`}>
                              {selectedComunicacion.estado?.nombre_estado || 'Pendiente'}
                            </span>
                          </div>
                          <MdArrowForward className="preview-arrow" />
                          <div className="preview-item">
                            <span className="preview-label">Nuevo Estado:</span>
                            <span className={`badge badge-${estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado?.toLowerCase().replace(' ', '-') || 'pendiente'}`}>
                              {estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado || 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formulario de cambio */}
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor="nuevo-estado">
                          <MdAssignment className="form-icon" />
                          Nuevo Estado <span className="required">*</span>
                        </label>
                        <select
                          id="nuevo-estado"
                          value={nuevoEstado}
                          onChange={(e) => setNuevoEstado(Number(e.target.value))}
                          className="form-select"
                        >
                          {estados.map((estado) => (
                            <option key={estado.id_estado} value={estado.id_estado}>
                              {estado.nombre_estado}
                            </option>
                          ))}
                        </select>
                        <small className="form-help-text">
                          Seleccione el nuevo estado de la comunicación
                        </small>
                      </div>

                      {/* Prioridad solo para quejas y sugerencias, no para reconocimientos */}
                      {selectedComunicacion.tipo !== 'Reconocimiento' && (
                        <div className="form-group">
                          <label htmlFor="nueva-prioridad">
                            <MdPriorityHigh className="form-icon" />
                            Prioridad <span className="required">*</span>
                          </label>
                          <select
                            id="nueva-prioridad"
                            value={nuevaPrioridad}
                            onChange={(e) => setNuevaPrioridad(e.target.value as 'Baja' | 'Media' | 'Alta' | 'Urgente')}
                            className="form-select"
                          >
                            <option value="Baja">Baja</option>
                            <option value="Media">Media</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </select>
                          <small className="form-help-text">
                            Asigne la prioridad según la urgencia del caso
                          </small>
                        </div>
                      )}

                      <div className="form-group">
                        <label htmlFor="nuevo-responsable">
                          <MdPerson className="form-icon" />
                          Responsable
                        </label>
                        <input
                          id="nuevo-responsable"
                          type="text"
                          value={nuevoResponsable}
                          onChange={(e) => setNuevoResponsable(e.target.value)}
                          placeholder="Nombre del responsable o área"
                          className="form-input"
                        />
                        <small className="form-help-text">
                          Indique quién se encargará de esta comunicación
                        </small>
                      </div>

                      <div className="form-group form-group-full">
                        <label htmlFor="nuevas-notas">
                          <MdNotes className="form-icon" />
                          Notas y Comentarios
                          {(estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado === 'Atendida' || 
                            estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado === 'Cerrada') && (
                            <span className="required">*</span>
                          )}
                        </label>
                        <textarea
                          id="nuevas-notas"
                          value={nuevasNotas}
                          onChange={(e) => setNuevasNotas(e.target.value)}
                          rows={5}
                          placeholder="Notas sobre el cambio de estado, acciones tomadas, solución aplicada, etc. Estas notas serán visibles para el usuario cuando el estado sea 'Atendida' o 'Cerrada'."
                          className="form-textarea"
                          maxLength={1000}
                        />
                        <div className="form-footer">
                          <small className="form-help-text">
                            {(estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado === 'Atendida' || 
                              estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado === 'Cerrada') && (
                              <span className="help-important">
                                <MdInfo className="help-icon" />
                                Estas notas serán visibles para el usuario. Proporcione información clara sobre la solución o respuesta.
                              </span>
                            )}
                            {(!estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado || 
                              (estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado !== 'Atendida' && 
                               estados.find(e => e.id_estado === nuevoEstado)?.nombre_estado !== 'Cerrada')) && (
                              <span>Notas internas sobre el cambio de estado</span>
                            )}
                          </small>
                          <small className="character-count">
                            {nuevasNotas.length}/1000 caracteres
                          </small>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox para mostrar públicamente (solo para reconocimientos) */}
                    {selectedComunicacion.tipo === 'Reconocimiento' && (
                      <div className="form-group form-group-full">
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '1rem',
                          background: '#e7f3ff',
                          borderRadius: '8px',
                          border: '2px solid #2196F3',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => setMostrarPublico(!mostrarPublico)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#d1e7ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#e7f3ff';
                        }}
                        >
                          <input
                            type="checkbox"
                            id="mostrar-publico"
                            checked={mostrarPublico}
                            onChange={(e) => setMostrarPublico(e.target.checked)}
                            style={{
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer'
                            }}
                          />
                          <label htmlFor="mostrar-publico" style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            margin: 0,
                            flex: 1
                          }}>
                            {mostrarPublico ? (
                              <MdPublic style={{ color: '#2196F3', fontSize: '1.5rem' }} />
                            ) : (
                              <MdPublicOff style={{ color: '#999', fontSize: '1.5rem' }} />
                            )}
                            <div>
                              <strong style={{ color: '#1976D2', fontSize: '1rem' }}>
                                Mostrar en la página pública de Felicitaciones y Reconocimientos
                              </strong>
                              <p style={{ margin: '0.25rem 0 0 0', color: '#555', fontSize: '0.9rem' }}>
                                Al activar esta opción, este reconocimiento será visible para todos los usuarios en la página de reconocimientos.
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Información adicional */}
                    <div className="form-info-box">
                      <MdInfo className="info-icon" />
                      <div className="info-content">
                        <strong>Importante:</strong>
                        <ul>
                          <li>Los cambios se guardarán en el historial de estados</li>
                          <li>Si el estado es "Atendida" o "Cerrada", las notas serán visibles para el usuario</li>
                          {selectedComunicacion.tipo === 'Reconocimiento' ? (
                            <>
                              <li>Los reconocimientos no requieren prioridad, ya que son mensajes positivos para destacar el buen trabajo</li>
                              <li>Puede seleccionar si desea mostrar este reconocimiento en la página pública de Felicitaciones y Reconocimientos</li>
                            </>
                          ) : (
                            <li>Asigne la prioridad según la urgencia del caso</li>
                          )}
                          <li>La fecha de resolución se establecerá automáticamente</li>
                        </ul>
                      </div>
                    </div>

                    <div className="modal-actions">
                      <button className="btn-secondary" onClick={() => setShowModal(false)}>
                        <MdClose /> Cancelar
                      </button>
                      <button className="btn-primary" onClick={handleGuardarEstado}>
                        <MdCheckCircle /> Guardar Cambio
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GestionReconocimientos;

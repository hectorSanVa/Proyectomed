import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../components/common/ToastContainer';
import ConfirmModal from '../../components/common/ConfirmModal';
import { MdSearch, MdRefresh, MdVisibility, MdEdit, MdDelete, MdClose, MdPictureAsPdf } from 'react-icons/md';
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
  const [filterEstado, setFilterEstado] = useState('Todos');
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
      
      const matchesEstado = filterEstado === 'Todos' || 
        c.estado?.nombre_estado === filterEstado;
      
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

  const getPrioridadBadge = (prioridad?: 'Baja' | 'Media' | 'Alta' | 'Urgente') => {
    const prioridadActual = prioridad || 'Media';
    const prioridadClass = prioridadActual.toLowerCase();
    return <span className={`badge badge-prioridad badge-${prioridadClass}`}>{prioridadActual}</span>;
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
        setEvidencias(evidenciasData);

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

  const descargarPDFComunicacion = async () => {
    if (!selectedComunicacion) return;

    try {
      setGenerandoPDF(true);
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = margin;
      const lineHeight = 7;

      const colorAzul: [number, number, number] = [25, 45, 99];
      const colorNegro: [number, number, number] = [0, 0, 0];

      doc.setFontSize(14);
      doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('FORMATO DE QUEJAS, SUGERENCIAS Y RECONOCIMIENTOS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight;
      doc.setFontSize(12);
      doc.text('FORMATO DE QUEJAS Y SUGERENCIAS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 1.5;

      doc.setFontSize(10);
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Folio:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedComunicacion.folio || 'N/A', margin + 20, yPosition);
      yPosition += lineHeight * 2;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      doc.text('DATOS DEL REMITENTE', margin, yPosition);
      yPosition += lineHeight * 1.2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      
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
        doc.setTextColor(128, 128, 128);
        doc.text('Los datos personales del remitente han sido ocultados por solicitud de confidencialidad.', margin, yPosition, { maxWidth: pageWidth - (margin * 2) });
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
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
        doc.text(usuarioComunicacion.semestre_area || 'N/A', margin + 50, yPosition);
        yPosition += lineHeight;
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

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      doc.text('TIPO DE COMUNICACIÓN', margin, yPosition);
      yPosition += lineHeight * 1.2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
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

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      doc.text('DETALLES DE LA QUEJA O SUGERENCIA', margin, yPosition);
      yPosition += lineHeight * 1.2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const fechaFormateada = selectedComunicacion.fecha_recepcion 
        ? new Date(selectedComunicacion.fecha_recepcion).toLocaleDateString('es-MX')
        : 'N/A';
      doc.text(fechaFormateada, margin + 20, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'bold');
      doc.text('Área involucrada:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedComunicacion.area_involucrada || 'N/A', margin + 40, yPosition);
      yPosition += lineHeight * 1.2;

      doc.setFont('helvetica', 'bold');
      doc.text('Descripción de hechos:', margin, yPosition);
      yPosition += lineHeight;
      doc.setFont('helvetica', 'normal');
      const descripcionLines = doc.splitTextToSize(selectedComunicacion.descripcion || 'N/A', pageWidth - (margin * 2));
      descripcionLines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight;

      if (selectedComunicacion.seguimiento?.notas) {
        if (yPosition > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Propuesta de mejora (opcional):', margin, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'normal');
        const notasLines = doc.splitTextToSize(selectedComunicacion.seguimiento.notas, pageWidth - (margin * 2));
        notasLines.forEach((line: string) => {
          if (yPosition > doc.internal.pageSize.getHeight() - 30) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        yPosition += lineHeight;
      }

      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      doc.text('EVIDENCIA (Opcional)', margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      doc.text('Si considera necesario envíe fotos, documentos o cualquier evidencia al correo quejasysugerenciasfmht@unach.mx', margin, yPosition, { maxWidth: pageWidth - (margin * 2) });
      yPosition += lineHeight * 1.2;

      if (evidencias.length > 0) {
        evidencias.forEach((evidencia) => {
          doc.setFont('helvetica', 'bold');
          doc.text('Se adjunta evidencia: Sí', margin, yPosition);
          yPosition += lineHeight;
          doc.setFont('helvetica', 'normal');
          doc.text(`Tipo: ${evidencia.tipo_archivo}`, margin, yPosition);
          yPosition += lineHeight;
          doc.text(`Nombre: ${evidencia.nombre_archivo}`, margin, yPosition);
          yPosition += lineHeight * 1.2;
        });
      } else {
        doc.text('No se adjunta evidencia', margin, yPosition);
        yPosition += lineHeight;
      }

      if (yPosition > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPosition = margin;
      }
      yPosition += lineHeight * 2;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorAzul[0], colorAzul[1], colorAzul[2]);
      doc.text('FIRMA (Opcional)', margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Firma del remitente:', margin, yPosition);
      yPosition += lineHeight * 2;

      doc.setFont('helvetica', 'bold');
      doc.text('Fecha:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-MX'), margin + 20, yPosition);

      const fileName = `formato_${selectedComunicacion.folio || selectedComunicacion.id_comunicacion}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
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
    setNuevaPrioridad((comunicacion.seguimiento?.prioridad as 'Baja' | 'Media' | 'Alta' | 'Urgente') || 'Media');
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
    
    try {
      // Crear o actualizar seguimiento
      if (selectedComunicacion.seguimiento?.id_seguimiento) {
        await seguimientoService.update(selectedComunicacion.seguimiento.id_seguimiento, {
          id_estado: nuevoEstado,
          responsable: nuevoResponsable,
          notas: nuevasNotas,
          prioridad: nuevaPrioridad,
        });
      } else {
        await seguimientoService.create({
          id_comunicacion: selectedComunicacion.id_comunicacion!,
          id_estado: nuevoEstado,
          responsable: nuevoResponsable,
          notas: nuevasNotas,
          prioridad: nuevaPrioridad,
        });
      }
      
      // Crear registro en historial
      await historialEstadoService.create({
        id_comunicacion: selectedComunicacion.id_comunicacion!,
        id_estado: nuevoEstado,
        responsable: nuevoResponsable,
        notas: nuevasNotas,
      });
      
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error al guardar estado:', error);
      showToast('Error al guardar el estado', 'error');
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
            <h1>Gestión de Reconocimientos</h1>
            <p>Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV</p>
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#fff3cd', 
              borderRadius: '6px', 
              borderLeft: '4px solid #ffc107',
              fontSize: '0.9rem',
              color: '#856404'
            }}>
              <strong>Nota:</strong> Los reconocimientos son mensajes positivos para destacar el buen trabajo, acciones positivas o logros de miembros de la comunidad. 
              Una vez que un reconocimiento sea marcado como "Atendida" o "Cerrada", se publicará automáticamente en la página pública de Reconocimientos 
              para que toda la comunidad pueda verlo.
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
              <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)}>
                <option>Todos</option>
                <option>Pendiente</option>
                <option>En Proceso</option>
                <option>Atendida</option>
                <option>Cerrada</option>
              </select>
              <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)}>
                <option>Todas</option>
                {categorias.map((cat) => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre_categoria}
                  </option>
                ))}
              </select>
              <select value={ordenPor} onChange={(e) => setOrdenPor(e.target.value as 'fecha' | 'folio' | 'estado')}>
                <option value="fecha">Ordenar por Fecha</option>
                <option value="folio">Ordenar por Folio</option>
                <option value="estado">Ordenar por Estado</option>
              </select>
              <select value={ordenDireccion} onChange={(e) => setOrdenDireccion(e.target.value as 'asc' | 'desc')}>
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
            <div className="filtros-fechas">
              <label>Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
              <label>Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
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
                    <th>Prioridad</th>
                    <th>Estado</th>
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
                      <td>{getPrioridadBadge(comunicacion.seguimiento?.prioridad)}</td>
                      <td>{getEstadoBadge(comunicacion)}</td>
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
                        <span className="modal-value">{getEstadoBadge(selectedComunicacion)}</span>
                      </div>
                      <div className="modal-info-row">
                        <span className="modal-label">Prioridad:</span>
                        <span className="modal-value">{getPrioridadBadge(selectedComunicacion.seguimiento?.prioridad)}</span>
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
                    <div className="form-group">
                      <label>Nuevo Estado</label>
                      <select
                        value={nuevoEstado}
                        onChange={(e) => setNuevoEstado(Number(e.target.value))}
                      >
                        {estados.map((estado) => (
                          <option key={estado.id_estado} value={estado.id_estado}>
                            {estado.nombre_estado}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Prioridad</label>
                      <select
                        value={nuevaPrioridad}
                        onChange={(e) => setNuevaPrioridad(e.target.value as 'Baja' | 'Media' | 'Alta' | 'Urgente')}
                      >
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Responsable</label>
                      <input
                        type="text"
                        value={nuevoResponsable}
                        onChange={(e) => setNuevoResponsable(e.target.value)}
                        placeholder="Nombre del responsable"
                      />
                    </div>
                    <div className="form-group">
                      <label>Notas</label>
                      <textarea
                        value={nuevasNotas}
                        onChange={(e) => setNuevasNotas(e.target.value)}
                        rows={4}
                        placeholder="Notas sobre el cambio de estado..."
                      />
                    </div>
                    <div className="modal-actions">
                      <button className="btn-primary" onClick={handleGuardarEstado}>
                        Guardar Cambio
                      </button>
                      <button className="btn-secondary" onClick={() => setShowModal(false)}>
                        Cancelar
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

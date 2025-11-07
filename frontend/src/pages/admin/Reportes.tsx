import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../components/common/ToastContainer';
import { MdBarChart, MdFileDownload, MdRefresh, MdPictureAsPdf } from 'react-icons/md';
import { comunicacionService } from '../../services/comunicacionService';
import { categoriaService } from '../../services/categoriaService';
import { estadoService } from '../../services/estadoService';
import { seguimientoService } from '../../services/seguimientoService';
import type { Comunicacion, Categoria, Estado } from '../../types';
import jsPDF from 'jspdf';
import './GestionComunicaciones.css';

interface ComunicacionConEstado extends Comunicacion {
  estado?: Estado;
}

const Reportes = () => {
  const { showToast } = useToast();
  const [comunicaciones, setComunicaciones] = useState<ComunicacionConEstado[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [exportando, setExportando] = useState<'csv' | 'txt' | 'pdf' | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comData, catData, estadosData] = await Promise.all([
        comunicacionService.getAll(),
        categoriaService.getAll(),
        estadoService.getAll()
      ]);
      
      // Cargar estados para cada comunicación
      const comsConEstado = await Promise.all(
        comData.map(async (com: Comunicacion) => {
          try {
            const seguimiento = await seguimientoService.getByComunicacionId(com.id_comunicacion!);
            if (seguimiento) {
              const estado = estadosData.find((e: Estado) => e.id_estado === seguimiento.id_estado);
              return { ...com, estado };
            }
            return { ...com, estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente') };
          } catch {
            return { ...com, estado: estadosData.find((e: Estado) => e.nombre_estado === 'Pendiente') };
          }
        })
      );
      
      setComunicaciones(comsConEstado);
      setCategorias(catData);
      setEstados(estadosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredComunicaciones = () => {
    let filtered = comunicaciones;
    
    // Filtro por tipo
    if (filterTipo !== 'Todos') {
      filtered = filtered.filter(c => c.tipo === filterTipo);
    }
    
    // Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      filtered = filtered.filter(c => {
        if (!c.fecha_recepcion) return false;
        const fechaCom = new Date(c.fecha_recepcion);
        if (fechaDesde) {
          const desde = new Date(fechaDesde);
          desde.setHours(0, 0, 0, 0);
          if (fechaCom < desde) return false;
        }
        if (fechaHasta) {
          const hasta = new Date(fechaHasta);
          hasta.setHours(23, 59, 59, 999);
          if (fechaCom > hasta) return false;
        }
        return true;
      });
    }
    
    return filtered;
  };

  const getStats = () => {
    const filtered = getFilteredComunicaciones();
    const quejas = filtered.filter(c => c.tipo === 'Queja');
    const sugerencias = filtered.filter(c => c.tipo === 'Sugerencia');
    const reconocimientos = filtered.filter(c => c.tipo === 'Reconocimiento');

    const porCategoria = categorias.map(cat => ({
      categoria: cat.nombre_categoria,
      total: filtered.filter(c => c.id_categoria === cat.id_categoria).length,
      quejas: quejas.filter(c => c.id_categoria === cat.id_categoria).length,
      sugerencias: sugerencias.filter(c => c.id_categoria === cat.id_categoria).length,
      reconocimientos: reconocimientos.filter(c => c.id_categoria === cat.id_categoria).length,
    })).filter(s => s.total > 0);

    // Estadísticas por estado
    const porEstado = estados.map(est => ({
      estado: est.nombre_estado,
      cantidad: filtered.filter(c => c.estado?.nombre_estado === est.nombre_estado).length,
    })).filter(s => s.cantidad > 0);

    return {
      total: filtered.length,
      quejas: quejas.length,
      sugerencias: sugerencias.length,
      reconocimientos: reconocimientos.length,
      porCategoria,
      porEstado,
    };
  };

  const stats = getStats();

  // Función para exportar a CSV
  const exportarCSV = () => {
    try {
      setExportando('csv');
      const filtered = getFilteredComunicaciones();
      
      if (filtered.length === 0) {
        showToast('No hay datos para exportar con los filtros actuales', 'warning');
        setExportando(null);
        return;
      }

      const headers = ['Folio', 'Tipo', 'Categoría', 'Fecha Recepción', 'Estado', 'Descripción', 'Área Involucrada'];
      const rows = filtered.map(com => {
        const categoria = categorias.find(c => c.id_categoria === com.id_categoria);
        return [
          com.folio || '',
          com.tipo || '',
          categoria?.nombre_categoria || 'N/A',
          com.fecha_recepcion ? new Date(com.fecha_recepcion).toLocaleDateString('es-MX') : 'N/A',
          com.estado?.nombre_estado || 'Pendiente',
          (com.descripcion || '').replace(/"/g, '""').replace(/\n/g, ' ').substring(0, 200),
          (com.area_involucrada || 'N/A').replace(/"/g, '""')
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell)}"`).join(','))
      ].join('\n');

      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `reporte_buzon_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMensajeExito('Archivo CSV descargado exitosamente');
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      showToast('Error al exportar el archivo CSV', 'error');
    } finally {
      setExportando(null);
    }
  };

  // Función para exportar reporte completo en texto
  const exportarReporteCompleto = () => {
    try {
      setExportando('txt');
      const filtered = getFilteredComunicaciones();
      
      if (filtered.length === 0) {
        showToast('No hay datos para exportar con los filtros actuales', 'warning');
        setExportando(null);
        return;
      }

      const fecha = new Date().toLocaleString('es-MX');
      let contenido = `REPORTE DEL BUZÓN DE QUEJAS, SUGERENCIAS Y RECONOCIMIENTOS\n`;
      contenido += `Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV\n`;
      contenido += `Fecha de generación: ${fecha}\n`;
      if (fechaDesde || fechaHasta) {
        contenido += `Período: ${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}\n`;
      }
      if (filterTipo !== 'Todos') {
        contenido += `Tipo: ${filterTipo}\n`;
      }
      contenido += `\n${'='.repeat(80)}\n\n`;

      // Estadísticas generales
      contenido += `ESTADÍSTICAS GENERALES\n`;
      contenido += `${'-'.repeat(80)}\n`;
      contenido += `Total de Comunicaciones: ${stats.total}\n`;
      contenido += `Quejas: ${stats.quejas}\n`;
      contenido += `Sugerencias: ${stats.sugerencias}\n`;
      contenido += `Reconocimientos: ${stats.reconocimientos}\n\n`;

      // Estadísticas por categoría
      if (stats.porCategoria.length > 0) {
        contenido += `ESTADÍSTICAS POR CATEGORÍA\n`;
        contenido += `${'-'.repeat(80)}\n`;
        stats.porCategoria.forEach(stat => {
          contenido += `${stat.categoria}:\n`;
          contenido += `  Total: ${stat.total}\n`;
          contenido += `  Quejas: ${stat.quejas}\n`;
          contenido += `  Sugerencias: ${stat.sugerencias}\n`;
          contenido += `  Reconocimientos: ${stat.reconocimientos}\n\n`;
        });
      }

      // Estadísticas por estado
      if (stats.porEstado && stats.porEstado.length > 0) {
        contenido += `\n${'-'.repeat(80)}\n`;
        contenido += `ESTADÍSTICAS POR ESTADO\n`;
        contenido += `${'-'.repeat(80)}\n`;
        stats.porEstado.forEach(stat => {
          contenido += `${stat.estado}: ${stat.cantidad}\n`;
        });
        contenido += `\n`;
      }

      // Detalle de comunicaciones
      contenido += `\n${'='.repeat(80)}\n`;
      contenido += `DETALLE DE COMUNICACIONES\n`;
      contenido += `${'='.repeat(80)}\n\n`;
      
      filtered.forEach((com, index) => {
        const categoria = categorias.find(c => c.id_categoria === com.id_categoria);
        contenido += `${index + 1}. Folio: ${com.folio || 'N/A'}\n`;
        contenido += `   Tipo: ${com.tipo || 'N/A'}\n`;
        contenido += `   Categoría: ${categoria?.nombre_categoria || 'N/A'}\n`;
        contenido += `   Estado: ${com.estado?.nombre_estado || 'Pendiente'}\n`;
        contenido += `   Fecha Recepción: ${com.fecha_recepcion ? new Date(com.fecha_recepcion).toLocaleDateString('es-MX') : 'N/A'}\n`;
        contenido += `   Descripción: ${(com.descripcion || 'N/A').substring(0, 200)}${com.descripcion && com.descripcion.length > 200 ? '...' : ''}\n`;
        contenido += `   Área Involucrada: ${com.area_involucrada || 'N/A'}\n`;
        contenido += `\n${'-'.repeat(80)}\n\n`;
      });

      const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `reporte_completo_buzon_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMensajeExito('Archivo TXT descargado exitosamente');
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (error) {
      console.error('Error al exportar TXT:', error);
      showToast('Error al exportar el archivo TXT', 'error');
    } finally {
      setExportando(null);
    }
  };

  // Función para exportar a PDF usando jsPDF
  const exportarPDF = () => {
    try {
      setExportando('pdf');
      const filtered = getFilteredComunicaciones();
      
      if (filtered.length === 0) {
        showToast('No hay datos para exportar con los filtros actuales', 'warning');
        setExportando(null);
        return;
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;
      const lineHeight = 7;
      const maxWidth = pageWidth - (margin * 2);

      // Colores
      const colorAzul = [25, 45, 99]; // #192d63
      const colorDorado = [212, 175, 55]; // #d4b012

      // Header
      doc.setFontSize(16);
      doc.setTextColor(...colorAzul);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DEL BUZÓN DE QUEJAS, SUGERENCIAS Y RECONOCIMIENTOS', pageWidth / 2, yPosition, { align: 'center', maxWidth });
      yPosition += lineHeight;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV', pageWidth / 2, yPosition, { align: 'center', maxWidth });
      yPosition += lineHeight * 1.5;

      // Fecha y filtros
      const fecha = new Date().toLocaleString('es-MX');
      doc.setFontSize(10);
      doc.text(`Fecha de generación: ${fecha}`, margin, yPosition);
      yPosition += lineHeight;

      if (fechaDesde || fechaHasta) {
        doc.text(`Período: ${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}`, margin, yPosition);
        yPosition += lineHeight;
      }

      if (filterTipo !== 'Todos') {
        doc.text(`Tipo: ${filterTipo}`, margin, yPosition);
        yPosition += lineHeight;
      }

      yPosition += lineHeight;

      // Estadísticas generales
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorAzul);
      doc.text('ESTADÍSTICAS GENERALES', margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Total de Comunicaciones: ${stats.total}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`Quejas: ${stats.quejas}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`Sugerencias: ${stats.sugerencias}`, margin + 5, yPosition);
      yPosition += lineHeight;
      doc.text(`Reconocimientos: ${stats.reconocimientos}`, margin + 5, yPosition);
      yPosition += lineHeight * 1.5;

      // Estadísticas por categoría
      if (stats.porCategoria.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorAzul);
        doc.text('ESTADÍSTICAS POR CATEGORÍA', margin, yPosition);
        yPosition += lineHeight;

        // Tabla de categorías
        const tableStartY = yPosition;
        const colWidths = [70, 25, 25, 30, 35];
        let xPos = margin;

        // Headers
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(...colorAzul);
        doc.rect(xPos, yPosition - 5, colWidths[0], 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('Categoría', xPos + 2, yPosition);
        xPos += colWidths[0];
        
        doc.setFillColor(...colorAzul);
        doc.rect(xPos, yPosition - 5, colWidths[1], 8, 'F');
        doc.text('Total', xPos + 2, yPosition);
        xPos += colWidths[1];
        
        doc.setFillColor(...colorAzul);
        doc.rect(xPos, yPosition - 5, colWidths[2], 8, 'F');
        doc.text('Quejas', xPos + 2, yPosition);
        xPos += colWidths[2];
        
        doc.setFillColor(...colorAzul);
        doc.rect(xPos, yPosition - 5, colWidths[3], 8, 'F');
        doc.text('Sug.', xPos + 2, yPosition);
        xPos += colWidths[3];
        
        doc.setFillColor(...colorAzul);
        doc.rect(xPos, yPosition - 5, colWidths[4], 8, 'F');
        doc.text('Recon.', xPos + 2, yPosition);
        
        yPosition += lineHeight * 1.2;
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        // Datos
        stats.porCategoria.forEach((stat, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          xPos = margin;
          doc.text(stat.categoria.substring(0, 20), xPos + 2, yPosition);
          xPos += colWidths[0];
          doc.text(stat.total.toString(), xPos + 2, yPosition);
          xPos += colWidths[1];
          doc.text(stat.quejas.toString(), xPos + 2, yPosition);
          xPos += colWidths[2];
          doc.text(stat.sugerencias.toString(), xPos + 2, yPosition);
          xPos += colWidths[3];
          doc.text(stat.reconocimientos.toString(), xPos + 2, yPosition);

          // Línea separadora
          doc.setDrawColor(200, 200, 200);
          doc.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
          yPosition += lineHeight * 1.2;
        });

        yPosition += lineHeight;
      }

      // Detalle de comunicaciones
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorAzul);
      doc.text('DETALLE DE COMUNICACIONES', margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Comunicaciones (limitadas para evitar PDF muy largo)
      const comunicacionesMostrar = filtered.slice(0, 50); // Máximo 50 en el PDF
      
      comunicacionesMostrar.forEach((com, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        const categoria = categorias.find(c => c.id_categoria === com.id_categoria);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. Folio: ${com.folio || 'N/A'}`, margin, yPosition);
        yPosition += lineHeight;

        doc.setFont('helvetica', 'normal');
        doc.text(`   Tipo: ${com.tipo || 'N/A'} | Categoría: ${categoria?.nombre_categoria || 'N/A'} | Estado: ${com.estado?.nombre_estado || 'Pendiente'}`, margin, yPosition);
        yPosition += lineHeight;
        doc.text(`   Fecha: ${com.fecha_recepcion ? new Date(com.fecha_recepcion).toLocaleDateString('es-MX') : 'N/A'}`, margin, yPosition);
        yPosition += lineHeight;
        
        const descripcion = (com.descripcion || 'N/A').substring(0, 100);
        const descripcionLines = doc.splitTextToSize(`   Descripción: ${descripcion}${com.descripcion && com.descripcion.length > 100 ? '...' : ''}`, maxWidth - 10);
        descripcionLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        yPosition += lineHeight * 0.5;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += lineHeight * 0.5;
      });

      if (filtered.length > 50) {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Nota: Se muestran las primeras 50 comunicaciones de un total de ${filtered.length}`, margin, yPosition);
      }

      // Footer en cada página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Guardar PDF
      const fileName = `reporte_buzon_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setMensajeExito('Archivo PDF descargado exitosamente');
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      showToast('Error al exportar el archivo PDF', 'error');
    } finally {
      setExportando(null);
    }
  };

  const getMaxValue = (data: { cantidad: number }[]) => {
    return Math.max(...data.map(d => d.cantidad), 1);
  };

  return (
    <AdminLayout>
      <div className="gestion-container">
        <div className="gestion-header">
          <h1>Reportes y Estadísticas</h1>
          <p>Visualiza estadísticas y genera reportes del sistema</p>
        </div>

        {/* Filtros */}
        <div className="filtros-section">
          <div className="filtros-content">
            <div className="filtros-selects">
              <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                <option>Todos</option>
                <option>Queja</option>
                <option>Sugerencia</option>
                <option>Reconocimiento</option>
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

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#28a745',
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <MdFileDownload />
            {mensajeExito}
          </div>
        )}

        {/* Botones de exportación */}
        <div className="gestion-toolbar">
          <div className="toolbar-actions">
            <div className="export-buttons-group">
              <button 
                className="btn-export-csv" 
                onClick={exportarCSV} 
                disabled={exportando !== null}
                title="Exportar a CSV (Excel)"
              >
                <MdFileDownload />
                {exportando === 'csv' ? 'Exportando...' : 'Exportar CSV'}
              </button>
              <button 
                className="btn-export-txt" 
                onClick={exportarReporteCompleto} 
                disabled={exportando !== null}
                title="Exportar reporte completo en texto"
              >
                <MdFileDownload />
                {exportando === 'txt' ? 'Exportando...' : 'Exportar TXT'}
              </button>
              <button 
                className="btn-export-pdf" 
                onClick={exportarPDF} 
                disabled={exportando !== null}
                title="Descargar como PDF"
              >
                <MdPictureAsPdf />
                {exportando === 'pdf' ? 'Generando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-message">
            <div>Cargando estadísticas...</div>
            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
              Por favor espera mientras se cargan los datos
            </div>
          </div>
        ) : (
          <div className="reportes-content">
            {/* Estadísticas principales */}
            <div className="stats-grid-reportes">
              <div className="stat-card-reporte">
                <div className="stat-icon">
                  <MdBarChart />
                </div>
                <div className="stat-info">
                  <h3>Total de Comunicaciones</h3>
                  <p className="stat-number">{stats.total}</p>
                </div>
              </div>

              <div className="stat-card-reporte">
                <div className="stat-icon stat-quejas">
                  <MdBarChart />
                </div>
                <div className="stat-info">
                  <h3>Quejas</h3>
                  <p className="stat-number">{stats.quejas}</p>
                </div>
              </div>

              <div className="stat-card-reporte">
                <div className="stat-icon stat-sugerencias">
                  <MdBarChart />
                </div>
                <div className="stat-info">
                  <h3>Sugerencias</h3>
                  <p className="stat-number">{stats.sugerencias}</p>
                </div>
              </div>

              <div className="stat-card-reporte">
                <div className="stat-icon stat-reconocimientos">
                  <MdBarChart />
                </div>
                <div className="stat-info">
                  <h3>Reconocimientos</h3>
                  <p className="stat-number">{stats.reconocimientos}</p>
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="charts-grid">
              <div className="dashboard-section">
                <h2>Distribución por Estado</h2>
                <div className="chart-container">
                  {stats.porEstado && stats.porEstado.length > 0 ? (
                    <div className="bar-chart">
                      {stats.porEstado.map((item, index) => {
                        const maxValue = getMaxValue(stats.porEstado);
                        const percentage = (item.cantidad / maxValue) * 100;
                        const colors = ['#ffc107', '#17a2b8', '#28a745', '#6c757d'];
                        return (
                          <div key={index} className="bar-item">
                            <div className="bar-label">{item.estado}</div>
                            <div className="bar-wrapper">
                              <div
                                className="bar"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: colors[index % colors.length],
                                }}
                              >
                                <span className="bar-value">{item.cantidad}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="placeholder-text">No hay datos por estado</p>
                  )}
                </div>
              </div>

              <div className="dashboard-section">
                <h2>Estadísticas por Categoría</h2>
                <div className="chart-container">
                  {stats.porCategoria.length === 0 ? (
                    <p className="placeholder-text">No hay datos por categoría</p>
                  ) : (
                    <div className="category-chart">
                      {stats.porCategoria.slice(0, 5).map((item, index) => {
                        const maxValue = Math.max(...stats.porCategoria.map(d => d.total), 1);
                        const percentage = (item.total / maxValue) * 100;
                        return (
                          <div key={index} className="category-item">
                            <div className="category-label">
                              <span>{item.categoria}</span>
                              <span className="category-total">{item.total}</span>
                            </div>
                            <div className="category-bar-wrapper">
                              <div
                                className="category-bar"
                                style={{ width: `${percentage}%` }}
                              >
                                <div className="category-breakdown">
                                  <span style={{ width: `${item.total > 0 ? (item.quejas / item.total) * 100 : 0}%`, backgroundColor: '#dc3545' }}></span>
                                  <span style={{ width: `${item.total > 0 ? (item.sugerencias / item.total) * 100 : 0}%`, backgroundColor: '#ffc107' }}></span>
                                  <span style={{ width: `${item.total > 0 ? (item.reconocimientos / item.total) * 100 : 0}%`, backgroundColor: '#28a745' }}></span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de estadísticas por categoría */}
            <div className="reporte-table-container">
              <h2>Estadísticas por Categoría</h2>
              {stats.porCategoria.length === 0 ? (
                <p className="no-data-message">No hay datos para mostrar</p>
              ) : (
                <table className="gestion-table">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Total</th>
                      <th>Quejas</th>
                      <th>Sugerencias</th>
                      <th>Reconocimientos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.porCategoria.map((stat, index) => (
                      <tr key={index}>
                        <td><strong>{stat.categoria}</strong></td>
                        <td>{stat.total}</td>
                        <td>{stat.quejas}</td>
                        <td>{stat.sugerencias}</td>
                        <td>{stat.reconocimientos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Información del reporte */}
            <div className="reporte-info-section">
              <h2>Información del Reporte</h2>
              <div className="info-box">
                <p><strong>Total de registros:</strong> {getFilteredComunicaciones().length}</p>
                <p><strong>Fecha de generación:</strong> {new Date().toLocaleString('es-MX')}</p>
                {(fechaDesde || fechaHasta) && (
                  <p><strong>Período:</strong> {fechaDesde || 'Inicio'} - {fechaHasta || 'Hoy'}</p>
                )}
                {filterTipo !== 'Todos' && (
                  <p><strong>Tipo filtrado:</strong> {filterTipo}</p>
                )}
                <p><strong>Nota:</strong> Los reportes incluyen las comunicaciones según los filtros aplicados.</p>
                <div className="export-info">
                  <h3>Opciones de Exportación:</h3>
                  <ul>
                    <li><strong>Exportar CSV:</strong> Descarga un archivo CSV que puedes abrir en Excel con todos los datos de las comunicaciones.</li>
                    <li><strong>Exportar TXT:</strong> Descarga un archivo de texto con estadísticas detalladas y el listado completo de comunicaciones.</li>
                    <li><strong>Exportar PDF:</strong> Abre una ventana de impresión que puedes guardar como PDF.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reportes;

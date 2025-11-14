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
      const lineHeight = 8; // Aumentado para mejor legibilidad
      const maxWidth = pageWidth - (margin * 2);

      // Colores profesionales mejorados
      const colorAzulOscuro = [25, 45, 99] as const; // #192d63 - Azul institucional
      const colorAzulClaro = [41, 128, 185] as const; // #2980b9 - Azul profesional
      const colorGrisOscuro = [44, 62, 80] as const; // #2c3e50 - Gris profesional
      // const colorGrisClaro = [108, 117, 125] as const; // #6c757d - Gris suave (no usado actualmente)
      const colorNegro = [33, 37, 41] as const; // #212529 - Negro suave
      const colorBlanco = [255, 255, 255] as const;
      const colorVerde = [40, 167, 69] as const; // #28a745 - Verde para estadísticas positivas

      // Header con fondo destacado
      doc.setFillColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(colorBlanco[0], colorBlanco[1], colorBlanco[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORTE DEL BUZÓN DE QUEJAS, SUGERENCIAS Y RECONOCIMIENTOS', pageWidth / 2, 15, { align: 'center', maxWidth });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV', pageWidth / 2, 25, { align: 'center', maxWidth });
      
      yPosition = 40;

      // Fecha y filtros con estilo mejorado
      const fecha = new Date().toLocaleString('es-MX');
      doc.setFontSize(12);
      doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha de generación:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      doc.text(fecha, margin + 50, yPosition);
      yPosition += lineHeight;

      if (fechaDesde || fechaHasta) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Período:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(`${fechaDesde || 'Inicio'} - ${fechaHasta || 'Hoy'}`, margin + 30, yPosition);
        yPosition += lineHeight;
      }

      if (filterTipo !== 'Todos') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Tipo:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(filterTipo, margin + 20, yPosition);
        yPosition += lineHeight;
      }

      yPosition += lineHeight * 0.5;
      
      // Línea decorativa
      doc.setDrawColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Estadísticas generales con fondo destacado
      doc.setFillColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorBlanco[0], colorBlanco[1], colorBlanco[2]);
      doc.text('ESTADÍSTICAS GENERALES', margin + 2, yPosition);
      yPosition += lineHeight * 2;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      
      // Total con estilo destacado
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
      doc.text(`Total de Comunicaciones:`, margin + 5, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorVerde[0], colorVerde[1], colorVerde[2]);
      doc.text(`${stats.total}`, pageWidth - margin - 20, yPosition, { align: 'right' });
      yPosition += lineHeight * 1.2;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
      doc.text(`• Quejas: ${stats.quejas}`, margin + 10, yPosition);
      yPosition += lineHeight;
      doc.text(`• Sugerencias: ${stats.sugerencias}`, margin + 10, yPosition);
      yPosition += lineHeight;
      doc.text(`• Reconocimientos: ${stats.reconocimientos}`, margin + 10, yPosition);
      yPosition += lineHeight * 1.5;

      // Estadísticas por categoría con fondo destacado
      if (stats.porCategoria.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin;
        }
        
        doc.setFillColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
        doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorBlanco[0], colorBlanco[1], colorBlanco[2]);
        doc.text('ESTADÍSTICAS POR CATEGORÍA', margin + 2, yPosition);
        yPosition += lineHeight * 1.8;

        // Tabla de categorías mejorada
        const colWidths = [75, 25, 25, 30, 35];
        let xPos = margin;

        // Headers con estilo mejorado
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.rect(xPos, yPosition - 5, colWidths[0], 8, 'F');
        doc.setTextColor(colorBlanco[0], colorBlanco[1], colorBlanco[2]);
        doc.text('Categoría', xPos + 3, yPosition);
        xPos += colWidths[0];
        
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.rect(xPos, yPosition - 5, colWidths[1], 8, 'F');
        doc.text('Total', xPos + 3, yPosition);
        xPos += colWidths[1];
        
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.rect(xPos, yPosition - 5, colWidths[2], 8, 'F');
        doc.text('Quejas', xPos + 3, yPosition);
        xPos += colWidths[2];
        
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.rect(xPos, yPosition - 5, colWidths[3], 8, 'F');
        doc.text('Sug.', xPos + 3, yPosition);
        xPos += colWidths[3];
        
        doc.setFillColor(colorAzulClaro[0], colorAzulClaro[1], colorAzulClaro[2]);
        doc.rect(xPos, yPosition - 5, colWidths[4], 8, 'F');
        doc.text('Recon.', xPos + 3, yPosition);
        
        yPosition += lineHeight * 1.3;
        doc.setFontSize(12);
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.setFont('helvetica', 'normal');

        // Datos con alternancia de colores
        stats.porCategoria.forEach((stat, index) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          // Fondo alternado para filas
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), lineHeight, 'F');
          }

          xPos = margin;
          doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
          doc.text(stat.categoria.substring(0, 25), xPos + 3, yPosition);
          xPos += colWidths[0];
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(colorVerde[0], colorVerde[1], colorVerde[2]);
          doc.text(stat.total.toString(), xPos + 3, yPosition);
          xPos += colWidths[1];
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
          doc.text(stat.quejas.toString(), xPos + 3, yPosition);
          xPos += colWidths[2];
          doc.text(stat.sugerencias.toString(), xPos + 3, yPosition);
          xPos += colWidths[3];
          doc.text(stat.reconocimientos.toString(), xPos + 3, yPosition);

          // Línea separadora más sutil
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition + 3, pageWidth - margin, yPosition + 3);
          yPosition += lineHeight * 1.3;
        });

        yPosition += lineHeight * 0.5;
      }

      // Detalle de comunicaciones con fondo destacado
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFillColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colorBlanco[0], colorBlanco[1], colorBlanco[2]);
      doc.text('DETALLE DE COMUNICACIONES', margin + 2, yPosition);
      yPosition += lineHeight * 1.8;

      // Comunicaciones (limitadas para evitar PDF muy largo)
      const comunicacionesMostrar = filtered.slice(0, 50); // Máximo 50 en el PDF
      
      comunicacionesMostrar.forEach((com, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        const categoria = categorias.find(c => c.id_categoria === com.id_categoria);
        
        // Guardar posición inicial para el fondo
        const inicioY = yPosition;
        const fechaFormateada = com.fecha_recepcion ? new Date(com.fecha_recepcion).toLocaleDateString('es-MX') : 'N/A';
        const descripcion = (com.descripcion || 'N/A').substring(0, 200);
        const descripcionLines = doc.splitTextToSize(descripcion + (com.descripcion && com.descripcion.length > 200 ? '...' : ''), maxWidth - 15);
        
        // Calcular altura total de la comunicación
        const alturaBase = lineHeight * 1.2 + (lineHeight * 4) + (lineHeight * 0.8) + (descripcionLines.length * lineHeight * 0.9) + (lineHeight * 0.3);
        
        // Dibujar fondo alternado primero
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, inicioY - 3, pageWidth - (margin * 2), alturaBase, 'F');
        }
        
        // Número y Folio
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
        doc.text(`${index + 1}.`, margin + 3, yPosition);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Folio:', margin + 12, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(com.folio || 'N/A', margin + 28, yPosition);
        yPosition += lineHeight * 1.2;

        // Tipo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Tipo:', margin + 3, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(com.tipo || 'N/A', margin + 20, yPosition);
        yPosition += lineHeight;

        // Categoría
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Categoría:', margin + 3, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(categoria?.nombre_categoria || 'N/A', margin + 35, yPosition);
        yPosition += lineHeight;

        // Estado
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Estado:', margin + 3, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(com.estado?.nombre_estado || 'Pendiente', margin + 28, yPosition);
        yPosition += lineHeight;

        // Fecha
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Fecha:', margin + 3, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        doc.text(fechaFormateada, margin + 25, yPosition);
        yPosition += lineHeight;
        
        // Descripción
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.text('Descripción:', margin + 3, yPosition);
        yPosition += lineHeight * 0.8;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(colorNegro[0], colorNegro[1], colorNegro[2]);
        descripcionLines.forEach((line: string) => {
          doc.text(line, margin + 8, yPosition);
          yPosition += lineHeight * 0.9;
        });

        yPosition += lineHeight * 0.3;
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.3);
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

      // Footer profesional en cada página
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Línea superior del footer
        doc.setDrawColor(colorAzulOscuro[0], colorAzulOscuro[1], colorAzulOscuro[2]);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        doc.setFontSize(10);
        doc.setTextColor(colorGrisOscuro[0], colorGrisOscuro[1], colorGrisOscuro[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
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

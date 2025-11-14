import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserLayout from '../components/user/UserLayout';
import { comunicacionService } from '../services/comunicacionService';
import { seguimientoService } from '../services/seguimientoService';
import { estadoService } from '../services/estadoService';
import { usuarioService } from '../services/usuarioService';
import { categoriaService } from '../services/categoriaService';
import { evidenciaService } from '../services/evidenciaService';
import type { Comunicacion, Estado, Seguimiento, Usuario, Categoria } from '../types';
import jsPDF from 'jspdf';
import logoIzquierdo from '../assets/img/logosuperiorizquiero.png';
import logoDerecho from '../assets/img/logosuperiorderecho.png';
import { MdPictureAsPdf } from 'react-icons/md';
import './ConsultaFolio.css';

const ConsultaFolio = () => {
  const [searchParams] = useSearchParams();
  const folioFromUrl = searchParams.get('folio') || '';
  
  const [folio, setFolio] = useState(folioFromUrl);
  const [comunicacion, setComunicacion] = useState<Comunicacion | null>(null);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [seguimiento, setSeguimiento] = useState<Seguimiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [categoriaComunicacion, setCategoriaComunicacion] = useState<Categoria | null>(null);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [usuarioComunicacion, setUsuarioComunicacion] = useState<Usuario | null>(null);

  // Buscar automáticamente si viene el folio en la URL
  useEffect(() => {
    if (folioFromUrl && folioFromUrl.trim()) {
      handleBuscar();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuscar = async () => {
    if (!folio.trim()) {
      setError('Por favor, ingrese un folio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resultado = await comunicacionService.getByFolio(folio.trim());
      
      if (resultado) {
        setComunicacion(resultado);
        
        // Cargar datos adicionales en paralelo
        const [seguimientoData, categoriasData, evidenciasData] = await Promise.all([
          seguimientoService.getByComunicacionId(resultado.id_comunicacion!).catch(() => null),
          categoriaService.getAll().catch(() => []),
          evidenciaService.getByComunicacionId(resultado.id_comunicacion!).catch(() => [])
        ]);

        // Obtener estado real del seguimiento
        try {
          if (seguimientoData) {
            setSeguimiento(seguimientoData);
            const estados = await estadoService.getAll();
            const estadoEncontrado = estados.find((e: Estado) => e.id_estado === seguimientoData.id_estado);
            setEstado(estadoEncontrado || null);
          } else {
            // Si no hay seguimiento, buscar estado "Pendiente"
            setSeguimiento(null);
            const estados = await estadoService.getAll();
            const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
            setEstado(pendiente || null);
          }
        } catch {
          // Si hay error al cargar el estado, usar "Pendiente" por defecto
          setSeguimiento(null);
          const estados = await estadoService.getAll();
          const pendiente = estados.find((e: Estado) => e.nombre_estado === 'Pendiente');
          setEstado(pendiente || null);
        }

        // Cargar categoría
        if (categoriasData && resultado.id_categoria) {
          const categoria = categoriasData.find((c: Categoria) => c.id_categoria === resultado.id_categoria);
          setCategoriaComunicacion(categoria || null);
        }

        // Filtrar evidencias: solo mostrar las subidas por el usuario, NO los PDFs generados
        const evidenciasUsuario = evidenciasData.filter((ev: any) => {
          const nombreArchivo = ev.nombre_archivo?.toLowerCase() || '';
          const esPDFGenerado = nombreArchivo.startsWith('formato_') || 
                                /^\d+_\d{4}-\d{2}-\d{2}\.pdf$/.test(nombreArchivo) ||
                                /^formato_.*\.pdf$/.test(nombreArchivo);
          return !esPDFGenerado;
        });
        setEvidencias(evidenciasUsuario);

        // Cargar datos del usuario si existe
        if (resultado.id_usuario) {
          try {
            const usuario = await usuarioService.getById(resultado.id_usuario);
            setUsuarioComunicacion(usuario);
          } catch (error) {
            console.error('Error al cargar usuario:', error);
            setUsuarioComunicacion(null);
          }
        } else {
          setUsuarioComunicacion(null);
        }
      } else {
        setError('No se encontró ninguna comunicación con ese folio');
        setComunicacion(null);
        setEstado(null);
        setSeguimiento(null);
      }
    } catch (err: any) {
      setError('Error al buscar el folio. Por favor, intente nuevamente.');
      setComunicacion(null);
      setEstado(null);
      setSeguimiento(null);
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string | Date | undefined) => {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/A';
    }
  };

  // Función auxiliar para cargar imagen como base64
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
            const base64 = canvas.toDataURL('image/png');
            resolve(base64);
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

  // Función para descargar PDF de la comunicación
  const descargarPDF = async () => {
    if (!comunicacion) return;

    try {
      setGenerandoPDF(true);
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = margin;
      const lineHeight = 8;

      // Colores profesionales
      const colorAzulOscuro: [number, number, number] = [25, 45, 99];
      const colorAzulClaro: [number, number, number] = [41, 128, 185];
      const colorGrisOscuro: [number, number, number] = [44, 62, 80];
      const colorGrisClaro: [number, number, number] = [108, 117, 125];
      const colorNegro: [number, number, number] = [33, 37, 41];
      const colorBlanco: [number, number, number] = [255, 255, 255];

      // Cargar logos
      let logoIzquierdoBase64: string | null = null;
      let logoDerechoBase64: string | null = null;
      
      try {
        logoIzquierdoBase64 = await loadImageAsBase64(logoIzquierdo);
        logoDerechoBase64 = await loadImageAsBase64(logoDerecho);
      } catch (error) {
        console.warn('Error al cargar logos para PDF:', error);
      }

      // Header con logos (similar a FormularioPublico)
      const headerY = 10;
      const maxLogoHeight = 20;
      const maxLogoWidth = 45;

      if (logoIzquierdoBase64) {
        try {
          const img = new Image();
          img.src = logoIzquierdoBase64;
          await new Promise((resolve) => {
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let logoWidth = maxLogoWidth;
              let logoHeight = maxLogoWidth / aspectRatio;
              if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = maxLogoHeight * aspectRatio;
              }
              doc.addImage(logoIzquierdoBase64, 'PNG', margin, headerY, logoWidth, logoHeight);
              resolve(null);
            };
            img.onerror = resolve;
          });
        } catch (error) {
          console.warn('Error al agregar logo izquierdo:', error);
        }
      }

      if (logoDerechoBase64) {
        try {
          const img = new Image();
          img.src = logoDerechoBase64;
          await new Promise((resolve) => {
            img.onload = () => {
              const aspectRatio = img.width / img.height;
              let logoWidth = maxLogoWidth;
              let logoHeight = maxLogoWidth / aspectRatio;
              if (logoHeight > maxLogoHeight) {
                logoHeight = maxLogoHeight;
                logoWidth = maxLogoHeight * aspectRatio;
              }
              doc.addImage(logoDerechoBase64, 'PNG', pageWidth - margin - logoWidth, headerY, logoWidth, logoHeight);
              resolve(null);
            };
            img.onerror = resolve;
          });
        } catch (error) {
          console.warn('Error al agregar logo derecho:', error);
        }
      }

      const logoHeight = maxLogoHeight;
      yPosition = headerY + logoHeight + 8;

      // Título principal
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorAzulOscuro);
      doc.text('FORMATO DE QUEJAS, SUGERENCIAS Y RECONOCIMIENTOS', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 1.2;

      const subtitulo = comunicacion.tipo === 'Reconocimiento' 
        ? 'FORMATO DE RECONOCIMIENTOS'
        : 'FORMATO DE QUEJAS Y SUGERENCIAS';
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorAzulClaro);
      doc.text(subtitulo, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 1.5;

      // Línea separadora
      doc.setDrawColor(...colorAzulOscuro);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight * 1.5;

      // Folio
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Folio:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      doc.text(comunicacion.folio || 'N/A', margin + 25, yPosition);
      yPosition += lineHeight * 1.5;

      // DATOS DEL REMITENTE
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

      // Verificar si es confidencial/anónimo
      const esConfidencial = usuarioComunicacion?.confidencial === true;
      const esAnonimo = !comunicacion.id_usuario;

      if (esAnonimo || esConfidencial) {
        doc.setFont('helvetica', 'bold');
        doc.text('Tipo:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        if (esConfidencial) {
          doc.text('Comunicación Confidencial', margin + 20, yPosition);
        } else {
          doc.text('Comunicación Anónima', margin + 20, yPosition);
        }
        yPosition += lineHeight;
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...colorGrisClaro);
        if (esConfidencial) {
          doc.text('Los datos personales del remitente han sido ocultados por solicitud de confidencialidad.', margin, yPosition, { maxWidth: pageWidth - (margin * 2) });
        } else {
          doc.text('Esta comunicación fue enviada de forma anónima. No se guardaron datos personales del remitente.', margin, yPosition, { maxWidth: pageWidth - (margin * 2) });
        }
        doc.setTextColor(...colorNegro);
        yPosition += lineHeight * 1.5;
      } else if (usuarioComunicacion) {
        // Mostrar datos del usuario si no es confidencial
        if (usuarioComunicacion.nombre) {
          doc.setFont('helvetica', 'bold');
          doc.text('Nombre (Opcional):', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.nombre, margin + 50, yPosition);
          yPosition += lineHeight;
        }

        if (usuarioComunicacion.correo) {
          doc.setFont('helvetica', 'bold');
          doc.text('Correo electrónico:', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.correo, margin + 50, yPosition);
          yPosition += lineHeight;
        }

        // Semestre/área de adscripción (siempre mostrar, usar "N/A" si está vacío)
        // Etiqueta en línea separada porque es muy larga
        doc.setFont('helvetica', 'bold');
        doc.text('Semestre/área de adscripción:', margin, yPosition);
        yPosition += lineHeight;
        doc.setFont('helvetica', 'normal');
        const semestreArea = usuarioComunicacion.semestre_area || 'N/A';
        const semestreAreaLines = doc.splitTextToSize(semestreArea, pageWidth - (margin * 2));
        semestreAreaLines.forEach((line: string) => {
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });

        if (usuarioComunicacion.telefono) {
          doc.setFont('helvetica', 'bold');
          doc.text('Teléfono (opcional):', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.telefono, margin + 50, yPosition);
          yPosition += lineHeight;
        }

        if (usuarioComunicacion.tipo_usuario && comunicacion.tipo !== 'Reconocimiento') {
          doc.setFont('helvetica', 'bold');
          doc.text('Tipo de usuario:', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.tipo_usuario, margin + 50, yPosition);
          yPosition += lineHeight;
        }

        if (usuarioComunicacion.sexo && comunicacion.tipo !== 'Reconocimiento') {
          doc.setFont('helvetica', 'bold');
          doc.text('Sexo:', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.sexo, margin + 50, yPosition);
          yPosition += lineHeight;
        }

        if (comunicacion.tipo !== 'Reconocimiento') {
          doc.setFont('helvetica', 'bold');
          doc.text('Confidencial:', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.confidencial ? 'Sí' : 'No', margin + 50, yPosition);
          yPosition += lineHeight;

          doc.setFont('helvetica', 'bold');
          doc.text('Autorizo contacto:', margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(usuarioComunicacion.autorizo_contacto ? 'Sí' : 'No', margin + 50, yPosition);
          yPosition += lineHeight;
        }
        yPosition += lineHeight * 0.5;
      }

      // TIPO DE COMUNICACIÓN
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
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Tipo:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      doc.text(comunicacion.tipo || 'N/A', margin + 25, yPosition);
      yPosition += lineHeight;

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Categoría:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      doc.text(categoriaComunicacion?.nombre_categoria || 'N/A', margin + 30, yPosition);
      yPosition += lineHeight * 1.5;

      // DETALLES
      const detallesTitulo = comunicacion.tipo === 'Reconocimiento' 
        ? 'DETALLES DEL RECONOCIMIENTO'
        : 'DETALLES DE LA QUEJA O SUGERENCIA';
      doc.setFillColor(...colorAzulOscuro);
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorBlanco);
      doc.text(detallesTitulo, margin + 2, yPosition);
      yPosition += lineHeight * 1.8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Fecha:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      const fechaFormateada = comunicacion.fecha_recepcion 
        ? new Date(comunicacion.fecha_recepcion).toLocaleDateString('es-MX')
        : 'N/A';
      doc.text(fechaFormateada, margin + 25, yPosition);
      yPosition += lineHeight * 1.2;

      if (comunicacion.area_involucrada) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colorGrisOscuro);
        doc.text('Área involucrada:', margin, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colorNegro);
        doc.text(comunicacion.area_involucrada, margin + 45, yPosition);
        yPosition += lineHeight * 1.5;
      }

      // Descripción de hechos
      const descripcionTexto = comunicacion.descripcion || 'No se proporcionó descripción';
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colorGrisOscuro);
      doc.text('Descripción de hechos:', margin, yPosition);
      yPosition += lineHeight * 0.8;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colorNegro);
      const descripcionLines = doc.splitTextToSize(descripcionTexto, pageWidth - (margin * 2));
      descripcionLines.forEach((line: string) => {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += lineHeight * 0.8;

      // Propuesta de mejora (extraer de las notas del seguimiento si existe)
      if (comunicacion.tipo !== 'Reconocimiento' && seguimiento?.notas) {
        const notas = seguimiento.notas;
        const propuestaIndex = notas.indexOf('Propuesta de mejora:');
        
        if (propuestaIndex !== -1) {
          let propuestaTexto = notas.substring(propuestaIndex + 'Propuesta de mejora:'.length).trim();
          propuestaTexto = propuestaTexto.replace(/^\n+/, '').trim();
          
          if (propuestaTexto && propuestaTexto.length > 0) {
            if (yPosition > doc.internal.pageSize.getHeight() - 40) {
              doc.addPage();
              yPosition = margin;
            }
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...colorGrisOscuro);
            doc.text('Propuesta de mejora (opcional):', margin, yPosition);
            yPosition += lineHeight * 0.8;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...colorNegro);
            const propuestaLines = doc.splitTextToSize(propuestaTexto, pageWidth - (margin * 2));
            propuestaLines.forEach((line: string) => {
              if (yPosition > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                yPosition = margin;
              }
              doc.text(line, margin, yPosition);
              yPosition += lineHeight;
            });
            yPosition += lineHeight * 0.8;
          }
        }
      }

      // EVIDENCIA
      if (evidencias.length > 0) {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
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
          doc.text(evidencia.nombre_archivo || 'N/A', margin + 15, yPosition);
          yPosition += lineHeight;
        });
        yPosition += lineHeight * 0.5;
      } else {
        if (yPosition > doc.internal.pageSize.getHeight() - 30) {
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

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colorNegro);
        doc.text('No se adjunta evidencia', margin, yPosition);
        yPosition += lineHeight;
      }

      // Sección de FIRMA eliminada - no se puede firmar digitalmente

      // Descargar PDF
      const fileName = `formato_${comunicacion.folio || comunicacion.id_comunicacion}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✅ PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor, intente nuevamente.');
    } finally {
      setGenerandoPDF(false);
    }
  };

  return (
    <UserLayout>
      <div className="consulta-container">
        <div className="consulta-main">
        <div className="consulta-wrapper">
          <h1 className="consulta-title">Consulta de Folio</h1>
          <p className="consulta-subtitle">
            Ingrese su folio para consultar el estado de su queja, sugerencia o reconocimiento
          </p>

          <div className="busqueda-section">
            <div className="busqueda-input-group">
              <input
                type="text"
                placeholder="Ej: D0001/01/FMHT/25"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
                className="folio-input"
              />
              <button
                onClick={handleBuscar}
                disabled={loading}
                className="btn-buscar"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {comunicacion && (
            <div className="resultado-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="resultado-title">Información de su Comunicación</h2>
                <button
                  onClick={descargarPDF}
                  disabled={generandoPDF}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: generandoPDF ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    opacity: generandoPDF ? 0.6 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!generandoPDF) {
                      e.currentTarget.style.backgroundColor = '#c82333';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!generandoPDF) {
                      e.currentTarget.style.backgroundColor = '#dc3545';
                    }
                  }}
                >
                  <MdPictureAsPdf size={20} />
                  {generandoPDF ? 'Generando PDF...' : 'Descargar PDF'}
                </button>
              </div>
              
              <div className="resultado-card">
                <div className="resultado-row">
                  <span className="resultado-label">Folio:</span>
                  <span className="resultado-value folio">{comunicacion.folio}</span>
                </div>

                <div className="resultado-row">
                  <span className="resultado-label">Tipo:</span>
                  <span className="resultado-value tipo">{comunicacion.tipo}</span>
                </div>

                <div className="resultado-row">
                  <span className="resultado-label">Fecha de Recepción:</span>
                  <span className="resultado-value">
                    {comunicacion.fecha_recepcion 
                      ? new Date(comunicacion.fecha_recepcion).toLocaleDateString('es-MX')
                      : 'No disponible'}
                  </span>
                </div>

                <div className="resultado-row">
                  <span className="resultado-label">Estado:</span>
                  <span className={`resultado-value estado ${estado?.nombre_estado?.toLowerCase().replace(' ', '-') || 'pendiente'}`}>
                    {estado?.nombre_estado || 'Pendiente'}
                  </span>
                </div>

                {comunicacion.area_involucrada && (
                  <div className="resultado-row">
                    <span className="resultado-label">Área Involucrada:</span>
                    <span className="resultado-value">{comunicacion.area_involucrada}</span>
                  </div>
                )}

                <div className="resultado-row full-width">
                  <span className="resultado-label">Descripción:</span>
                  <div className="resultado-description">
                    {comunicacion.descripcion}
                  </div>
                </div>

                {/* Mostrar notas/comentarios si el estado es Atendida o Cerrada y hay notas */}
                {estado && (estado.nombre_estado === 'Atendida' || estado.nombre_estado === 'Cerrada') && 
                 seguimiento?.notas && seguimiento.notas.trim().length > 0 && (
                  <div className="resultado-row full-width">
                    <span className="resultado-label">Respuesta/Comentarios:</span>
                    <div className="resultado-respuesta">
                      <div className="respuesta-content">
                        {seguimiento.notas}
                      </div>
                      {seguimiento.fecha_resolucion && (
                        <div className="respuesta-fecha">
                          Resuelto el: {formatFecha(seguimiento.fecha_resolucion)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Mostrar mensaje si está atendida/cerrada pero sin notas */}
                {estado && (estado.nombre_estado === 'Atendida' || estado.nombre_estado === 'Cerrada') && 
                 (!seguimiento?.notas || !seguimiento.notas.trim()) && (
                  <div className="resultado-row full-width">
                    <span className="resultado-label">Respuesta/Comentarios:</span>
                    <div className="resultado-sin-respuesta">
                      Sin comentarios disponibles aún.
                    </div>
                  </div>
                )}
              </div>

              <div className="resultado-nota">
                <p>
                  <strong>Nota:</strong> Para más información sobre el seguimiento de su caso, 
                  puede comunicarse al correo: <strong>quejasysugerenciasfmht@unach.mx</strong>
                </p>
              </div>
            </div>
          )}

          <div className="consulta-info">
            <h3>¿No tiene su folio?</h3>
            <p>
              Si no recuerda su folio, puede contactarnos directamente al correo: 
              <strong> quejasysugerenciasfmht@unach.mx</strong>
            </p>
          </div>
        </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ConsultaFolio;


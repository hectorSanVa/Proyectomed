import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuarioAuth } from '../context/UsuarioAuthContext';
import { useToast } from '../components/common/ToastContainer';
import { usePageTitle } from '../hooks/usePageTitle';
import UserLayout from '../components/user/UserLayout';
import { comunicacionService } from '../services/comunicacionService';
import { categoriaService } from '../services/categoriaService';
// import { usuarioService } from '../services/usuarioService'; // Ya no se usa - todas las comunicaciones son anónimas
import { evidenciaService } from '../services/evidenciaService';
import type { ComunicacionCreate, Categoria, Usuario } from '../types';
import './FormularioPublico.css';

interface FormularioPublicoProps {
  withoutLayout?: boolean;
}

const FormularioPublico = ({ withoutLayout = false }: FormularioPublicoProps = {}) => {
  usePageTitle('Formulario');
  const navigate = useNavigate();
  const { session: usuario } = useUsuarioAuth();
  const { showToast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [folioGenerado, setFolioGenerado] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(10);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const successMessageRef = useRef<HTMLDivElement>(null);

  // Datos del remitente
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [semestreArea, setSemestreArea] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState<Usuario['tipo_usuario']>('Estudiante');
  const [sexo, setSexo] = useState<Usuario['sexo']>('Prefiero no responder');
  const [confidencial, setConfidencial] = useState(false);
  const [autorizoContacto, setAutorizoContacto] = useState(false);

  // Tipo de comunicación
  const [tipoComunicacion, setTipoComunicacion] = useState<'Queja' | 'Sugerencia' | 'Reconocimiento'>('Queja');
  const [categoria, setCategoria] = useState<number>(1);

  // Detalles
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [areaInvolucrada, setAreaInvolucrada] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [propuestaMejora, setPropuestaMejora] = useState('');
  
  // Límites de caracteres
  const MAX_DESCRIPCION = 2000;
  const MAX_PROPUESTA = 1000;
  const MAX_AREA = 150;

  // Evidencia
  const [archivos, setArchivos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Si está autenticado, pre-llenar el correo
    if (usuario?.correo) {
      setCorreo(usuario.correo);
    }

    // Cargar categorías
    categoriaService.getAll()
      .then(data => setCategorias(data))
      .catch(err => console.error('Error al cargar categorías:', err));

    // Limpiar intervalo al desmontar
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [usuario]);

  // Scroll automático cuando se muestra el mensaje de éxito
  useEffect(() => {
    if (success && successMessageRef.current) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        successMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validaciones
      if (!descripcion.trim()) {
        showToast('La descripción es obligatoria', 'error');
        setLoading(false);
        return;
      }
      
      if (descripcion.length > MAX_DESCRIPCION) {
        showToast(`La descripción no puede exceder ${MAX_DESCRIPCION} caracteres`, 'error');
        setLoading(false);
        return;
      }
      
      if (propuestaMejora.length > MAX_PROPUESTA) {
        showToast(`La propuesta de mejora no puede exceder ${MAX_PROPUESTA} caracteres`, 'error');
        setLoading(false);
        return;
      }
      
      // Validar fecha (no puede ser futura)
      const fechaSeleccionada = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      if (fechaSeleccionada > hoy) {
        showToast('La fecha no puede ser futura', 'error');
        setLoading(false);
        return;
      }

      // IMPORTANTE: NUNCA crear registros de usuario - TODAS las comunicaciones son anónimas
      // Esto garantiza que nadie tenga miedo a represalias
      const userId: number | null = null;

      // Crear comunicación
      const comunicacionData: ComunicacionCreate = {
        tipo: tipoComunicacion,
        id_usuario: userId,
        id_categoria: categoria,
        descripcion,
        area_involucrada: areaInvolucrada,
        medio: 'D', // Digital
      };

      const comunicacion = await comunicacionService.create(comunicacionData);
      
      // Subir archivos si hay alguno
      if (archivos.length > 0 && comunicacion.id_comunicacion) {
        try {
          for (const archivo of archivos) {
            await evidenciaService.upload(comunicacion.id_comunicacion!, archivo);
          }
        } catch (err) {
          console.error('Error al subir evidencias:', err);
          showToast('La comunicación se creó pero hubo un error al subir algunos archivos', 'warning');
        }
      }
      
      setFolioGenerado(comunicacion.folio);
      setSuccess(true);
      setCountdown(10);
      showToast(`¡${tipoComunicacion} enviada exitosamente! Folio: ${comunicacion.folio}`, 'success');

      // Contador regresivo y redirección
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            countdownIntervalRef.current = null;
            navigate(`/consulta-folio?folio=${comunicacion.folio}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      countdownIntervalRef.current = interval;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al enviar el formulario. Por favor, intente nuevamente.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formularioContent = (
    <>
      {success ? (
        <div className="formulario-container">
          <div className="formulario-main">
            <div className="success-message" ref={successMessageRef}>
              <h2>¡Formulario enviado exitosamente!</h2>
              <p className="folio-info">
                Su {tipoComunicacion.toLowerCase()} ha sido registrada con el folio:
              </p>
              <p className="folio-number">{folioGenerado}</p>
              <p className="folio-nota">
                Guarde este folio para dar seguimiento a su caso.
              </p>
              <div className="success-actions">
                <button 
                  className="btn-primary" 
                  onClick={() => navigate(`/consulta-folio?folio=${folioGenerado}`)}
                >
                  Ver Estado Ahora
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => navigate('/buzon')}
                >
                  Enviar Otra
                </button>
              </div>
              <p className="redirect-nota">
                Será redirigido automáticamente en{' '}
                <span className="countdown-number">{countdown}</span>
                {countdown === 1 ? ' segundo' : ' segundos'}...
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="formulario-container">
          <div className="formulario-main">
          <div className="formulario-wrapper">
          <h1 className="formulario-title">
            Formato de Quejas, Sugerencias y Reconocimientos
          </h1>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="formulario-form">
            {/* DATOS DEL REMITENTE */}
            <section className="form-section">
              <h2 className="section-title">Datos del Remitente</h2>
              
              <div className="form-group">
                <label htmlFor="nombre">Nombre (Opcional)</label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={confidencial}
                />
              </div>

              <div className="form-group">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  type="email"
                  id="correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required={!confidencial}
                  disabled={confidencial}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="semestre">Semestre/área de adscripción</label>
                  <input
                    type="text"
                    id="semestre"
                    value={semestreArea}
                    onChange={(e) => setSemestreArea(e.target.value)}
                    disabled={confidencial}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="telefono">Teléfono (opcional)</label>
                  <input
                    type="tel"
                    id="telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    disabled={confidencial}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de usuario</label>
                <div className="checkbox-group">
                  {(['Estudiante', 'Docente', 'Administrativo', 'Servicios Generales'] as const).map((tipo) => (
                    <label key={tipo} className="checkbox-label">
                      <input
                        type="radio"
                        name="tipoUsuario"
                        value={tipo}
                        checked={tipoUsuario === tipo}
                        onChange={(e) => setTipoUsuario(e.target.value as Usuario['tipo_usuario'])}
                        disabled={confidencial}
                      />
                      {tipo === 'Docente' ? 'Personal Docente' : tipo === 'Administrativo' ? 'Personal Administrativo' : tipo === 'Servicios Generales' ? 'Personal de servicios generales' : tipo}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>(Solo para fines estadísticos) Sexo</label>
                <div className="checkbox-group">
                  {(['Mujer', 'Hombre', 'Prefiero no responder'] as const).map((s) => (
                    <label key={s} className="checkbox-label">
                      <input
                        type="radio"
                        name="sexo"
                        value={s}
                        checked={sexo === s}
                        onChange={(e) => setSexo(e.target.value as Usuario['sexo'])}
                        disabled={confidencial}
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={confidencial}
                    onChange={(e) => setConfidencial(e.target.checked)}
                  />
                  Deseo que mi identidad sea confidencial
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={autorizoContacto}
                    onChange={(e) => setAutorizoContacto(e.target.checked)}
                    disabled={confidencial}
                  />
                  Autorizo que me contacten para dar seguimiento a mi caso
                </label>
              </div>
            </section>

            {/* TIPO DE COMUNICACIÓN */}
            <section className="form-section">
              <h2 className="section-title">Tipo de Comunicación</h2>
              
              <div className="form-group">
                <label>Marque la opción que corresponda</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="tipoComunicacion"
                      value="Queja"
                      checked={tipoComunicacion === 'Queja'}
                      onChange={(e) => setTipoComunicacion(e.target.value as 'Queja' | 'Sugerencia' | 'Reconocimiento')}
                    />
                    Queja
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="tipoComunicacion"
                      value="Sugerencia"
                      checked={tipoComunicacion === 'Sugerencia'}
                      onChange={(e) => setTipoComunicacion(e.target.value as 'Queja' | 'Sugerencia' | 'Reconocimiento')}
                    />
                    Sugerencia
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="radio"
                      name="tipoComunicacion"
                      value="Reconocimiento"
                      checked={tipoComunicacion === 'Reconocimiento'}
                      onChange={(e) => setTipoComunicacion(e.target.value as 'Queja' | 'Sugerencia' | 'Reconocimiento')}
                    />
                    Reconocimiento
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="categoria">Categoría</label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(Number(e.target.value))}
                  required
                >
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* DETALLES */}
            <section className="form-section">
              <h2 className="section-title">
                {tipoComunicacion === 'Reconocimiento' 
                  ? 'Detalles del Reconocimiento' 
                  : tipoComunicacion === 'Sugerencia'
                  ? 'Detalles de la Sugerencia'
                  : 'Detalles de la Queja'}
              </h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fecha">Fecha</label>
                  <input
                    type="date"
                    id="fecha"
                    value={fecha}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                    title="La fecha no puede ser futura"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="areaInvolucrada">
                    {tipoComunicacion === 'Reconocimiento' 
                      ? 'Área o persona reconocida' 
                      : 'Área involucrada'}
                  </label>
                  <input
                    type="text"
                    id="areaInvolucrada"
                    value={areaInvolucrada}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_AREA) {
                        setAreaInvolucrada(e.target.value);
                      }
                    }}
                    maxLength={MAX_AREA}
                    placeholder={tipoComunicacion === 'Reconocimiento' 
                      ? 'Ej: Departamento de Servicios Generales, Dr. Juan Pérez, etc.' 
                      : 'Ej: Departamento de Servicios Generales'}
                  />
                  <small className="character-count">
                    {areaInvolucrada.length}/{MAX_AREA} caracteres
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">
                  {tipoComunicacion === 'Reconocimiento' 
                    ? 'Descripción del reconocimiento' 
                    : 'Descripción de hechos'}
                </label>
                {tipoComunicacion === 'Reconocimiento' && (
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontStyle: 'italic' }}>
                    Describe el trabajo, acción positiva o logro que deseas reconocer. Este reconocimiento puede ser publicado en la página web una vez aprobado por la Comisión.
                  </p>
                )}
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPCION) {
                      setDescripcion(e.target.value);
                    }
                  }}
                  maxLength={MAX_DESCRIPCION}
                  rows={7}
                  required
                  placeholder="Describa detalladamente los hechos..."
                />
                <div className="character-counter">
                  <span className={descripcion.length > MAX_DESCRIPCION * 0.9 ? 'character-count-warning' : ''}>
                    {descripcion.length}/{MAX_DESCRIPCION} caracteres
                  </span>
                  {descripcion.length > 0 && (
                    <span className="character-count-hint">
                      {descripcion.length < 50 ? ' (mínimo recomendado: 50 caracteres)' : ''}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* PROPUESTA DE MEJORA */}
            <section className="form-section">
              <h2 className="section-title">Propuesta de mejora (opcional)</h2>
              <div className="form-group">
                <textarea
                  id="propuestaMejora"
                  value={propuestaMejora}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_PROPUESTA) {
                      setPropuestaMejora(e.target.value);
                    }
                  }}
                  maxLength={MAX_PROPUESTA}
                  rows={6}
                  placeholder="Si tiene alguna propuesta de mejora, descríbala aquí..."
                />
                <div className="character-counter">
                  <span className={propuestaMejora.length > MAX_PROPUESTA * 0.9 ? 'character-count-warning' : ''}>
                    {propuestaMejora.length}/{MAX_PROPUESTA} caracteres
                  </span>
                </div>
              </div>
            </section>

            {/* EVIDENCIA */}
            <section className="form-section">
              <h2 className="section-title">Evidencia (Opcional)</h2>
              <div className="form-group">
                <p className="form-note">
                  Puede adjuntar documentos, imágenes o videos como evidencia. 
                  Formatos permitidos: PDF, JPG, PNG, DOCX, XLSX, MP4 (máximo 10MB por archivo)
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="archivos" className="file-input-label">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="archivos"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.mp4"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      // Validar tamaño (10MB = 10 * 1024 * 1024 bytes)
                      const maxSize = 10 * 1024 * 1024;
                      const validFiles = files.filter(file => {
                        if (file.size > maxSize) {
                          showToast(`El archivo "${file.name}" excede el tamaño máximo de 10MB`, 'error');
                          return false;
                        }
                        return true;
                      });
                      if (validFiles.length > 0) {
                        setArchivos([...archivos, ...validFiles]);
                        showToast(`${validFiles.length} archivo(s) agregado(s) correctamente`, 'success');
                      }
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  <span className="file-input-button">Seleccionar Archivos</span>
                </label>
              </div>
              {archivos.length > 0 && (
                <div className="archivos-list">
                  <h4>Archivos seleccionados ({archivos.length}):</h4>
                  <ul>
                    {archivos.map((archivo, index) => (
                      <li key={index} className="archivo-item">
                        <span>{archivo.name}</span>
                        <span className="archivo-size">
                          ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                        <button
                          type="button"
                          className="btn-remove-file"
                          onClick={() => {
                            setArchivos(archivos.filter((_, i) => i !== index));
                          }}
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* NOTA */}
            <div className="form-note-section">
              <p>
                <strong>NOTA:</strong> Todas las quejas y sugerencias serán atendidas conforme al protocolo 
                establecido por la Facultad de Medicina, garantizando la confidencialidad y el respeto a los 
                derechos de los involucrados. Para dar seguimiento a su caso, puede comunicarse al correo: 
                <strong> quejasysugerenciasfmht@unach.mx</strong>
              </p>
            </div>

            {/* BOTONES */}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Formulario'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => window.location.reload()}>
                Limpiar Formulario
              </button>
              {withoutLayout && (
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => {
                    if (window.confirm('¿Está seguro que desea cancelar? Se perderán los datos ingresados.')) {
                      window.location.href = '/buzon';
                    }
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
          </div>
        </div>
      </div>
      )}
    </>
  );

  if (withoutLayout) {
    return formularioContent;
  }

  return <UserLayout>{formularioContent}</UserLayout>;
};

export default FormularioPublico;


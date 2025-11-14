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

      // VALIDACIÓN: Debe marcar al menos una opción (confidencial O autorizo contacto)
      if (!confidencial && !autorizoContacto) {
        showToast('Debe seleccionar al menos una opción: "Comunicación anónima" o "Autorizo contacto"', 'error');
        setLoading(false);
        return;
      }

      // VALIDACIÓN: Si marca "autorizo contacto", debe proporcionar correo
      const correoUsuario = usuario?.correo || correo || null;
      if (autorizoContacto && !correoUsuario) {
        showToast('Si autoriza contacto, debe proporcionar su correo electrónico', 'error');
        setLoading(false);
        return;
      }

      // Lógica de anonimato y seguimiento:
      // - Si confidencial = true → Comunicación completamente anónima (NO se guardan datos personales, id_usuario = null)
      // - Si autorizo contacto = true Y hay correo → Crear/obtener usuario para seguimiento (se guardan datos)
      // NOTA: "Confidencial" y "autorizo contacto" son mutuamente excluyentes
      const esAnonimo = confidencial; // Anónimo SOLO si está marcado como confidencial
      const debeGuardarUsuario = autorizoContacto && !confidencial && correoUsuario; // Guardar usuario solo si autoriza contacto, NO es confidencial y hay correo

      // Crear comunicación
      // El backend se encargará de crear/obtener el usuario si debeGuardarUsuario es true
      const comunicacionData: ComunicacionCreate = {
        tipo: tipoComunicacion,
        id_usuario: null, // El backend lo asignará si debeGuardarUsuario es true
        id_categoria: categoria,
        descripcion,
        area_involucrada: areaInvolucrada,
        medio: 'D', // Digital
        correo: debeGuardarUsuario ? correoUsuario : undefined, // Correo solo si debemos guardar usuario
        anonimo: esAnonimo, // Indicar si es anónimo o no
        // Enviar datos completos del usuario para guardar correctamente (solo si debeGuardarUsuario es true)
        usuario: debeGuardarUsuario ? {
          nombre: nombre.trim() || undefined, // Enviar undefined si está vacío
          telefono: telefono.trim() || undefined,
          semestre_area: semestreArea.trim() || undefined,
          tipo_usuario: tipoUsuario || 'Estudiante', // Siempre enviar un valor válido
          sexo: sexo || 'Prefiero no responder', // Siempre enviar un valor válido
          confidencial: false, // Si autoriza contacto, confidencial es siempre false
          autorizo_contacto: true // Si llegamos aquí, autoriza contacto es siempre true
        } : undefined,
        // Propuesta de mejora solo para quejas y sugerencias
        propuesta_mejora: (tipoComunicacion !== 'Reconocimiento' && propuestaMejora) ? propuestaMejora : undefined
      };

      console.log('📤 Enviando comunicación al backend:', {
        tipo: comunicacionData.tipo,
        anonimo: comunicacionData.anonimo,
        tieneCorreo: !!comunicacionData.correo,
        tieneUsuario: !!comunicacionData.usuario,
        usuarioConfidencial: comunicacionData.usuario?.confidencial,
        usuarioAutorizoContacto: comunicacionData.usuario?.autorizo_contacto
      });
      
      const comunicacion = await comunicacionService.create(comunicacionData);
      
      console.log('✅ Comunicación creada:', {
        id_comunicacion: comunicacion.id_comunicacion,
        folio: comunicacion.folio,
        id_usuario: comunicacion.id_usuario
      });
      
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

      // El folio y la asociación con el usuario (si no es anónimo) ya se guardaron en la base de datos
      // Si la comunicación NO es anónima, el backend creó/obtuvo el usuario en la tabla usuarios
      // y asoció la comunicación mediante id_usuario
      // Solo guardamos el último folio en localStorage para referencia rápida (opcional)
      try {
        localStorage.setItem('ultimo_folio', comunicacion.folio);
        if (esAnonimo) {
          console.log('✅ Comunicación anónima guardada. Folio:', comunicacion.folio);
        } else {
          console.log('✅ Comunicación guardada con seguimiento. Folio:', comunicacion.folio, 'Correo:', correoUsuario);
          console.log('✅ Usuario creado/obtenido en la tabla usuarios para seguimiento');
        }
      } catch (err) {
        console.warn('⚠️ Error al guardar último folio en localStorage:', err);
      }

      // Contador regresivo y redirección
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            countdownIntervalRef.current = null;
            // Usar setTimeout para evitar el warning de React sobre actualizar durante el render
            setTimeout(() => {
              navigate(`/consulta-folio?folio=${encodeURIComponent(comunicacion.folio)}`);
            }, 0);
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
            {tipoComunicacion === 'Reconocimiento' 
              ? 'Formato de Felicitaciones y Reconocimientos'
              : 'Formato de Quejas, Sugerencias y Reconocimientos'}
          </h1>
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="formulario-form">
            {/* TIPO DE COMUNICACIÓN - PRIMERO */}
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

            {/* DATOS DEL REMITENTE */}
            <section className="form-section">
              <h2 className="section-title">
                {tipoComunicacion === 'Reconocimiento' ? 'Datos del Remitente (Opcional)' : 'Datos del Remitente'}
              </h2>
              
              {tipoComunicacion === 'Reconocimiento' && (
                <div style={{ 
                  background: '#e7f3ff', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.5rem',
                  borderLeft: '4px solid #2196F3'
                }}>
                  <p style={{ margin: 0, color: '#1976D2', fontSize: '0.95rem' }}>
                    <strong>💡 Nota:</strong> Para reconocimientos, los datos del remitente son opcionales. 
                    Puedes enviar el reconocimiento de forma anónima si lo prefieres.
                  </p>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="nombre">Nombre {tipoComunicacion === 'Reconocimiento' ? '(Opcional)' : '(Opcional)'}</label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={confidencial}
                />
              </div>

              <div className="form-group">
                <label htmlFor="correo">
                  Correo electrónico 
                  {autorizoContacto && <span className="required">*</span>}
                  {!autorizoContacto && tipoComunicacion !== 'Reconocimiento' && !confidencial && <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}> (Opcional)</span>}
                  {tipoComunicacion === 'Reconocimiento' && !confidencial && <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 'normal' }}> (Opcional)</span>}
                </label>
                <input
                  type="email"
                  id="correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required={autorizoContacto}
                  disabled={confidencial}
                  placeholder={confidencial ? "No requerido para comunicaciones anónimas" : autorizoContacto ? "Obligatorio - Para dar seguimiento a tu caso" : tipoComunicacion === 'Reconocimiento' ? "Opcional - Para consultar el estado de tu reconocimiento" : "Opcional - Para consultar el estado de tu comunicación"}
                />
                {!confidencial && (
                  <small className="form-help-text">
                    {autorizoContacto 
                      ? "✅ Tu correo es obligatorio porque autorizaste contacto. Podremos comunicarnos contigo para dar seguimiento."
                      : tipoComunicacion === 'Reconocimiento' 
                        ? "Tu correo se usará solo para consultar el estado de tu reconocimiento. Tu identidad permanece protegida."
                        : "Tu correo se usará solo para consultar el estado de tu comunicación. Tu identidad permanece protegida."}
                  </small>
                )}
              </div>

              {tipoComunicacion !== 'Reconocimiento' && (
                <>
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
                </>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={confidencial}
                    onChange={(e) => {
                      setConfidencial(e.target.checked);
                      // Si marca confidencial, desmarcar autorizo contacto
                      if (e.target.checked) {
                        setAutorizoContacto(false);
                      }
                    }}
                  />
                  {tipoComunicacion === 'Reconocimiento' 
                    ? 'Deseo que mi reconocimiento sea completamente anónimo (sin seguimiento por correo)'
                    : 'Deseo que mi comunicación sea completamente anónima (sin seguimiento por correo)'}
                  <span className="required" style={{ marginLeft: '0.25rem' }}>*</span>
                </label>
                <small className="form-help-text" style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                  {confidencial 
                    ? tipoComunicacion === 'Reconocimiento'
                      ? "✅ Tu reconocimiento será completamente anónimo. No se guardará tu correo y no podrás consultar su estado por correo, solo por folio."
                      : "✅ Tu comunicación será completamente anónima. No se guardará tu correo y no podrás consultar su estado por correo, solo por folio."
                    : tipoComunicacion === 'Reconocimiento'
                      ? "ℹ️ Si proporcionas tu correo, podrás consultar el estado de tu reconocimiento iniciando sesión. Tu identidad permanece protegida."
                      : "ℹ️ Si proporcionas tu correo, podrás consultar el estado de tu comunicación iniciando sesión. Tu identidad permanece protegida."}
                </small>
              </div>

              {tipoComunicacion !== 'Reconocimiento' && (
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={autorizoContacto}
                      onChange={(e) => {
                        setAutorizoContacto(e.target.checked);
                        // Si marca autorizo contacto, desmarcar confidencial
                        if (e.target.checked) {
                          setConfidencial(false);
                        }
                      }}
                      disabled={confidencial}
                    />
                    Autorizo que me contacten para dar seguimiento a mi caso
                    <span className="required" style={{ marginLeft: '0.25rem' }}>*</span>
                  </label>
                  <small className="form-help-text" style={{ display: 'block', marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    {autorizoContacto 
                      ? "✅ Si autorizas contacto, tu correo es obligatorio. Podremos contactarte para dar seguimiento a tu caso."
                      : "ℹ️ Si autorizas contacto, podremos comunicarnos contigo para dar seguimiento. Tu correo será obligatorio."}
                  </small>
                </div>
              )}
              
              {tipoComunicacion !== 'Reconocimiento' && (
                <div style={{ 
                  background: '#fff3cd', 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  marginTop: '0.5rem',
                  borderLeft: '4px solid #ffc107'
                }}>
                  <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                    <strong>⚠️ Nota importante:</strong> Debe seleccionar al menos una opción: "Comunicación anónima" o "Autorizo contacto". 
                    Si autoriza contacto, deberá proporcionar su correo electrónico.
                  </p>
                </div>
              )}
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
                    ? 'Descripción del reconocimiento *' 
                    : 'Descripción de hechos'}
                </label>
                {tipoComunicacion === 'Reconocimiento' && (
                  <div style={{ 
                    background: '#fff3cd', 
                    padding: '0.75rem', 
                    borderRadius: '6px', 
                    marginBottom: '0.75rem',
                    borderLeft: '4px solid #ffc107'
                  }}>
                    <p style={{ margin: 0, color: '#856404', fontSize: '0.9rem' }}>
                      <strong>✨ Describe el trabajo, acción positiva o logro que deseas reconocer.</strong><br />
                      Menciona el nombre de la persona o área reconocida, qué hizo y por qué merece ser reconocido. 
                      Este reconocimiento puede ser publicado en la página web una vez aprobado por la Comisión.
                    </p>
                  </div>
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
                  rows={tipoComunicacion === 'Reconocimiento' ? 8 : 7}
                  required
                  placeholder={tipoComunicacion === 'Reconocimiento' 
                    ? "Ejemplo: Deseo reconocer al Dr. Juan Pérez del Departamento de Servicios Generales por su excelente atención y disposición para ayudar a los estudiantes. Su trabajo ha mejorado significativamente nuestra experiencia en la facultad..."
                    : "Describa detalladamente los hechos..."}
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

            {/* PROPUESTA DE MEJORA - Solo para Quejas y Sugerencias */}
            {tipoComunicacion !== 'Reconocimiento' && (
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
            )}

            {/* EVIDENCIA */}
            <section className="form-section">
              <h2 className="section-title">Evidencia (Opcional)</h2>
              <div className="form-group">
                <p className="form-note">
                  {tipoComunicacion === 'Reconocimiento' 
                    ? 'Puede adjuntar imágenes o videos que respalden el reconocimiento (fotos del evento, logro, etc.). Formatos permitidos: JPG, PNG, MP4 (máximo 10MB por archivo)'
                    : 'Puede adjuntar documentos, imágenes o videos como evidencia. Formatos permitidos: PDF, JPG, PNG, DOCX, XLSX, MP4 (máximo 10MB por archivo)'}
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="archivos" className="file-input-label">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="archivos"
                    multiple
                    accept={tipoComunicacion === 'Reconocimiento' ? ".jpg,.jpeg,.png,.mp4" : ".pdf,.jpg,.jpeg,.png,.docx,.xlsx,.mp4"}
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
                <strong>NOTA:</strong> {
                  tipoComunicacion === 'Reconocimiento' 
                    ? 'Los reconocimientos serán revisados por la Comisión y, si son aprobados, podrán ser publicados en la página web para exaltar el buen trabajo de las personas reconocidas. Para dar seguimiento a su reconocimiento, puede comunicarse al correo: '
                    : 'Todas las quejas y sugerencias serán atendidas conforme al protocolo establecido por la Facultad de Medicina, garantizando la confidencialidad y el respeto a los derechos de los involucrados. Para dar seguimiento a su caso, puede comunicarse al correo: '
                }
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


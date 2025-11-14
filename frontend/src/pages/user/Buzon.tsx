import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuarioAuth } from '../../context/UsuarioAuthContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import UserLayout from '../../components/user/UserLayout';
import { MdWarning, MdLightbulb, MdStar, MdDescription, MdKeyboardArrowDown, MdKeyboardArrowUp, MdClose } from 'react-icons/md';
import FormularioPublico from '../FormularioPublico';
import './Buzon.css';

const Buzon = () => {
  usePageTitle('Buzón');
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useUsuarioAuth();
  const [showFormulario, setShowFormulario] = useState(false);

  // Mostrar carga mientras se verifica la autenticación
  if (loading) {
    return (
      <UserLayout>
        <div className="buzon-container">
          <p>Cargando...</p>
        </div>
      </UserLayout>
    );
  }

  // Si está autenticado, mostrar contenido informativo y opción para mostrar formulario
  if (isAuthenticated) {
    return (
      <UserLayout>
        <div className="buzon-container">
          <h1>Buzón de Quejas, Sugerencias y Reconocimientos</h1>
          <p className="buzon-subtitle">Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV</p>

          <div className="buzon-intro-card">
            <div className="intro-content">
              <h2>¡Tu voz es importante!</h2>
              <p>Este es un espacio completamente anónimo y seguro. Tu identidad nunca será registrada.</p>
            </div>
          </div>

          <div className="tipo-mensaje-section">
            <p className="tipo-mensaje-intro">Para ayudarnos a gestionar tu solicitud, por favor selecciona el tipo de mensaje que deseas enviar:</p>
            <div className="tipo-cards">
              <div className="tipo-card">
                <div className="tipo-icon queja">
                  <MdWarning />
                </div>
                <h4>Queja</h4>
                <p>Reportar una inconformidad o un problema que necesita atención.</p>
              </div>
              <div className="tipo-card">
                <div className="tipo-icon sugerencia">
                  <MdLightbulb />
                </div>
                <h4>Sugerencia</h4>
                <p>Proponer una idea para mejorar algún aspecto de la facultad.</p>
              </div>
              <div className="tipo-card">
                <div className="tipo-icon reconocimiento">
                  <MdStar />
                </div>
                <h4>Reconocimiento</h4>
                <p>Reconocer y destacar el buen trabajo, acciones positivas o logros de estudiantes, docentes, personal administrativo o áreas de la facultad. Estos reconocimientos pueden ser publicados en la página web una vez aprobados por la Comisión.</p>
              </div>
            </div>
          </div>

          <div className="formulario-toggle-section">
            <button 
              className={`btn-toggle-formulario ${showFormulario ? 'active' : ''}`}
              onClick={() => setShowFormulario(!showFormulario)}
            >
              <MdDescription className="btn-icon-form" />
              <span className="btn-text">
                {showFormulario ? 'Ocultar Formulario' : 'Mostrar Formulario'}
              </span>
              {showFormulario ? (
                <MdKeyboardArrowUp className="btn-arrow" />
              ) : (
                <MdKeyboardArrowDown className="btn-arrow" />
              )}
            </button>
          </div>

          {showFormulario && (
            <div className="formulario-wrapper-buzon">
              <div className="formulario-header-buzon">
                <h3>Formulario de Quejas, Sugerencias y Reconocimientos</h3>
                <button 
                  className="btn-cerrar-formulario"
                  onClick={() => setShowFormulario(false)}
                  title="Cerrar formulario"
                >
                  <MdClose />
                </button>
              </div>
              <FormularioPublico withoutLayout={true} />
            </div>
          )}

          <div className="info-sections">
            <section className="info-card">
              <div className="card-header">
                <h2>Justificación</h2>
              </div>
              <p>
                La presente propuesta nace de los resultados de la Auditoría realizada a esta Unidad académica 
                y de las recomendaciones recibidas en el proceso de acreditación de la Licenciatura en Médico 
                Cirujano Plan de estudios 2013, por el organismo acreditador (COMAEM); alineados a la política 
                de calidad institucional específicamente con los objetivos de Calidad educativa, Responsabilidad 
                social universitaria y Gestión y evaluación institucional.
              </p>
            </section>

            <section className="info-card">
              <div className="card-header">
                <h2>Mecanismo para el Funcionamiento</h2>
              </div>
              
              <div className="subseccion">
                <h3>1. Objetivo</h3>
                <p>
                  Establecer un mecanismo eficiente, transparente y confidencial para la recolección, gestión 
                  y resolución de quejas y sugerencias por parte de estudiantes, docentes y personal administrativo 
                  de la Unidad Académica, en congruencia con la política de calidad institucional para la mejora 
                  continua con respeto a los derechos humanos y en apego a la legislación universitaria.
                </p>
              </div>

              <div className="subseccion">
                <h3>2. Modalidades de Recepción de Quejas y Sugerencias</h3>
                
                <div className="modalidad">
                  <h4>a) Buzón Físico</h4>
                  <ul>
                    <li>Son 2 buzones en lugares estratégicos de la facultad (primera planta del edificio A y planta baja del edificio "B")</li>
                    <li>Los usuarios anotarán sus quejas o sugerencias en el formato foliado destinado para tal efecto y que será depositado en los buzones habilitados.</li>
                    <li>El manejo del buzón estará a cargo de la Comisión de recepción de quejas, sugerencias y reconocimientos</li>
                    <li>Se garantizará la confidencialidad y el acceso restringido a los responsables del manejo del buzón.</li>
                  </ul>
                </div>

                <div className="modalidad">
                  <h4>b) Plataforma Digital</h4>
                  <ul>
                    <li>Se habilitará un formulario en la página web oficial de la facultad, sita en https://medicinatapachula.unach.mx/ con folio de registro para su seguimiento.</li>
                    <li>Todas las comunicaciones son completamente anónimas para garantizar tu seguridad y evitar cualquier miedo a represalias.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>

          <div className="info-adicional-card">
            <h3>Información Importante</h3>
            <ul>
              <li>Todas las comunicaciones son completamente anónimas - no se guarda información personal</li>
              <li>Recibirás un folio único para dar seguimiento a tu caso</li>
              <li>Puedes consultar el estado en cualquier momento</li>
              <li>Para más información: <strong>quejasysugerenciasfmht@unach.mx</strong></li>
            </ul>
          </div>
        </div>
      </UserLayout>
    );
  }

  // Si no está autenticado, mostrar mensaje de acceso requerido
  if (!isAuthenticated) {
    return (
      <UserLayout>
        <div className="buzon-container">
          <h1>Buzón de Quejas, Sugerencias y Reconocimientos</h1>
          <p className="buzon-subtitle">Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" Campus IV</p>

          <div className="buzon-intro-card">
            <div className="intro-content">
              <h2>¡Tu voz es importante!</h2>
              <p>Este es un espacio completamente anónimo y seguro. Tu identidad nunca será registrada.</p>
            </div>
          </div>

          <div className="tipo-mensaje-section">
            <p className="tipo-mensaje-intro">Para ayudarnos a gestionar tu solicitud, por favor selecciona el tipo de mensaje que deseas enviar:</p>
            <div className="tipo-cards">
              <div className="tipo-card">
                <div className="tipo-icon queja">
                  <MdWarning />
                </div>
                <h4>Queja</h4>
                <p>Reportar una inconformidad o un problema que necesita atención.</p>
              </div>
              <div className="tipo-card">
                <div className="tipo-icon sugerencia">
                  <MdLightbulb />
                </div>
                <h4>Sugerencia</h4>
                <p>Proponer una idea para mejorar algún aspecto de la facultad.</p>
              </div>
              <div className="tipo-card">
                <div className="tipo-icon reconocimiento">
                  <MdStar />
                </div>
                <h4>Reconocimiento</h4>
                <p>Reconocer y destacar el buen trabajo, acciones positivas o logros de estudiantes, docentes, personal administrativo o áreas de la facultad. Estos reconocimientos pueden ser publicados en la página web una vez aprobados por la Comisión.</p>
              </div>
            </div>
          </div>

          <div className="acceso-requerido-card">
            <h2>Acceso Requerido</h2>
            <h3>Iniciar Sesión Requerido</h3>
            <p>Para enviar quejas, sugerencias o reconocimientos, necesitas iniciar sesión en el sistema.</p>
            <div className="acceso-buttons">
              <button 
                className="btn-primary-acceso"
                onClick={() => navigate('/login')}
              >
                Iniciar Sesión
              </button>
              <button 
                className="btn-secondary-acceso"
                onClick={() => navigate('/register')}
              >
                Registrarse
              </button>
            </div>
            <div className="acceso-links">
              <p>¿Ya tienes una cuenta? <span onClick={() => navigate('/login')}>Inicia sesión aquí</span></p>
              <p>¿No tienes cuenta? <span onClick={() => navigate('/register')}>Regístrate aquí</span></p>
            </div>
          </div>
        </div>
      </UserLayout>
    );
  }

  return null;
};

export default Buzon;


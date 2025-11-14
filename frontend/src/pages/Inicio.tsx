// import { Link } from 'react-router-dom'; // No usado actualmente
import { usePageTitle } from '../hooks/usePageTitle';
import UserLayout from '../components/user/UserLayout';
import './Inicio.css';

const Inicio = () => {
  usePageTitle('Inicio');
  return (
    <UserLayout>
      <div className="inicio-container">
        <div className="inicio-main">
        <div className="inicio-content">
          <div className="nota-comision">
            <p>• El manejo del buzón está a cargo de la Comisión de recepción de quejas, sugerencias y reconocimientos.</p>
          </div>

          <div className="info-card principal">
            <div className="card-header">
              <h2>¿Qué puedes hacer aquí?</h2>
            </div>
            <p className="card-intro">Utiliza el menú lateral para acceder a las diferentes funciones del sistema:</p>
            
            <div className="funciones-list">
              <div className="funcion-item">
                <div className="funcion-icon"></div>
                <div className="funcion-content">
                  <strong>Buzón:</strong> Envía tus quejas, sugerencias o reconocimientos.
                </div>
              </div>
              <div className="funcion-item">
                <div className="funcion-icon"></div>
                <div className="funcion-content">
                  <strong>Seguimiento:</strong> Consulta el estado de tus casos.
                </div>
              </div>
              <div className="funcion-item">
                <div className="funcion-icon"></div>
                <div className="funcion-content">
                  <strong>Reconocimientos:</strong> Conoce a quienes han sido destacados.
                </div>
              </div>
              <div className="funcion-item">
                <div className="funcion-icon"></div>
                <div className="funcion-content">
                  <strong>Contacto:</strong> Comunícate con la administración.
                </div>
              </div>
              <div className="funcion-item">
                <div className="funcion-icon"></div>
                <div className="funcion-content">
                  <strong>Consultar Folio:</strong> Busca el estado de una comunicación usando tu número de folio.
                </div>
              </div>
            </div>

            <div className="participacion-banner">
              <p>¡Tu participación es importante! Este sistema es confidencial y seguro.</p>
            </div>
          </div>

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
                    <li>Se permitirá el envío anónimo o identificado, según la preferencia del usuario.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default Inicio;


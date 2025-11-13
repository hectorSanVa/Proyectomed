import './Footer.css';
import logoMascota from '../assets/img/logomascotafooter.png';
import logoDerecho from '../assets/img/logosuperiorderecho.png';

const Footer = () => {
  return (
    <footer className="footer-unach">
      <div className="footer-content">
        <div className="footer-logos-container">
          <div className="footer-logo-left">
            <img 
              src={logoMascota} 
              alt="Logo Mascota UNACH" 
              className="footer-logo-mascota"
            />
          </div>
          <div className="footer-text-content">
            <p className="footer-copyright">
              © 2025 Facultad de Medicina Humana "Dr. Manuel Velasco Suárez" - Benemérita Universidad Autónoma de Chiapas
            </p>
            <p className="footer-address">
              Carretera Puerto Madero Km. 10.5, Finca Santa Teresa, Tapachula, Chiapas, México | C.P. 30825
            </p>
            <p className="footer-contact">
              Tel: (961) 6178000 ext. 5695 | www.fmhtapachula@unach.mx
            </p>
            <p className="footer-rights">Todos los derechos reservados.</p>
          </div>
          <div className="footer-logo-right">
            <img 
              src={logoDerecho} 
              alt="Logo UNACH" 
              className="footer-logo-derecho"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;




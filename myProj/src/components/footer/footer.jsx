import { Link } from "react-router-dom";
import "./footer.css";
import logo from "../../assets/logo11.png";

export default function Footer({ user }) {
  return (
    <footer className="footer-wrapper">
      {!user && (
        <div className="footer-newsletter">
          <div className="footer-newsletter-brand">
            <p className="footer-kicker">UrgentFlow Support</p>
            <h2>Stay close to the healthcare updates that matter.</h2>
            <p>
              Emergency guidance, hospital access updates, and smoother patient
              communication in one place.
            </p>
          </div>
          <Link to="/signup" className="footer-newsletter-cta">
            Create Account
          </Link>
        </div>
      )}

      <div className="footer-panel">
        <div className="footer-content">
          <div className="footer-column branding">
            <Link to="/" className="footer-brand-link">
              <img src={logo} alt="UrgentFlow logo" className="footer-logo" />
            </Link>
            <div className="tagline">
              <p>Navigating Health Together.</p>
              <p>
                Smart access to care, less waiting, and clearer emergency flow.
              </p>
            </div>
          </div>

          <div className="footer-column">
            <h4>Quick Menu</h4>
            <nav className="footer-links">
              <Link to="/">Home</Link>
              <Link to="/hospitals">Hospitals</Link>
              <Link to="/emergency">Emergency</Link>
              <Link to="/about">About</Link>
            </nav>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <p>+216 99 999 999</p>
            <p>urgentflow@gmail.com</p>
            <p>Tunisia healthcare routing support</p>
          </div>
        </div>

        <hr className="footer-divider" />
        <div className="footer-bottom-row">
          <p className="copyright">© 2026 UrgentFlow. All rights reserved.</p>
          <div className="footer-mini-links">
            <Link to="/about">Privacy</Link>
            <Link to="/about">Terms</Link>
            <Link to="/about">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

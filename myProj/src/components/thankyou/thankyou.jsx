import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/logo11.png";
import Footer from "../footer/footer.jsx";
import "./thanksyou.css";
import { getStoredUser } from "../../utils/auth.js";

export default function ThankYouPage() {
  const user = getStoredUser();
  return (
    <div className="thankyou-page-root">
      <Link to="/hospitals" className="back-btn thank-you-back-btn">
        <FontAwesomeIcon icon={faArrowLeft} size="xl" />
      </Link>

      <main className="thankyou-content-shell">
        <section className="thankyou-hero">
          <Link to="/" className="thankyou-logo-link">
            <img src={logo} alt="UrgentFlow logo" className="thankyou-logo" />
          </Link>

          <div className="thankyou-badge">
            <FontAwesomeIcon icon={faCircleCheck} />
            <span>Booking received</span>
          </div>

          <h1 className="main-thankyou-title">Your place is confirmed.</h1>
          <p className="large-instruction">
            Your booking was added successfully. Check your notifications and
            SMS details for your queue turn and estimated waiting time.
          </p>
        </section>

        <section className="thankyou-details-strip">
          <div className="thankyou-detail">
            <h3>Track your visit</h3>
            <p>
              Open your appointments page to follow this visit and any next
              appointments added by the medical staff.
            </p>
          </div>
          <div className="thankyou-detail">
            <h3>Stay reachable</h3>
            <p>
              Keep your phone close so you do not miss your queue updates or
              any emergency callbacks.
            </p>
          </div>
          <div className="thankyou-detail">
            <h3>Need help?</h3>
            <p>
              Contact us at{" "}
              <a href="mailto:UrgentFlow@gmail.com" className="contact-link">
                UrgentFlow@gmail.com
              </a>
            </p>
          </div>
        </section>

        <div className="thankyou-actions">
          <Link to="/appointments" className="thankyou-primary-link">
            Open my appointments
          </Link>
          <Link to="/" className="thankyou-secondary-link">
            Return home
          </Link>
        </div>
      </main>

      <Footer user={user} />
    </div>
  );
}

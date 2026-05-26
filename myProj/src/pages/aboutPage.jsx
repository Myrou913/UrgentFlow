import { Link } from "react-router-dom";
import Nav from "../components/nav/nav.jsx";
import Footer from "../components/footer/footer.jsx";
import "./infoPages.css";
import "./aboutPage.css";
import { getStoredUser } from "../utils/auth.js";

const STATS = [
  { value: "40%", label: "Reduction in waiting time" },
  { value: "24/7", label: "Emergency access" },
  { value: "100+", label: "Healthcare centers" },
  { value: "3 min", label: "Average booking time" },
];

const VALUES = [
  { icon: "⚡", title: "Speed", desc: "We eliminate unnecessary waiting. Every second counts in healthcare." },
  { icon: "🎯", title: "Precision", desc: "Smart queue management routes patients to the right service instantly." },
  { icon: "🔒", title: "Privacy", desc: "Your medical data stays yours. We never share it without consent." },
  { icon: "🌍", title: "Accessibility", desc: "Built for every patient in Tunisia, regardless of location or device." },
];

export default function AboutPage({ setUser }) {
  const user = getStoredUser();

  return (
    <>
      <Nav user={user} setUser={setUser} />
      <main className="about-main">

        {/* Hero */}
        <section className="about-hero-new">
          <div className="about-hero-content">
            <span className="about-badge">About UrgentFlow</span>
            <h1>Healthcare access,<br /><span className="about-accent">reimagined.</span></h1>
            <p>
              UrgentFlow connects patients with hospitals, clinics, and pharmacies across Tunisia —
              reducing wait times, simplifying bookings, and making emergency care reachable for everyone.
            </p>
            <div className="about-hero-actions">
              <Link to="/hospitals" className="about-btn-primary">Find a hospital</Link>
              <Link to="/emergency" className="about-btn-ghost">Emergency access</Link>
            </div>
          </div>
          <div className="about-hero-stats">
            {STATS.map((s) => (
              <div key={s.label} className="about-stat">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mission */}
        <section className="about-mission">
          <div className="about-mission-text">
            <h2>Our Mission</h2>
            <p>
              We believe no one should wait hours in a crowded hospital when technology can do better.
              UrgentFlow was built to give every patient in Tunisia instant access to the care they need —
              with real-time queue management, smart hospital matching, and emergency routing.
            </p>
          </div>
          <div className="about-mission-visual">
            <div className="about-mission-card">
              <h3>What we do</h3>
              <ul>
                <li>✓ Real-time appointment booking</li>
                <li>✓ Nearby hospital & clinic search</li>
                <li>✓ Emergency request routing</li>
                <li>✓ Smart queue management</li>
                <li>✓ SMS & email notifications</li>
                <li>✓ Multi-language support</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="about-values">
          <h2>What drives us</h2>
          <div className="about-values-grid">
            {VALUES.map((v) => (
              <div key={v.title} className="about-value-card">
                <span className="about-value-icon">{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="about-cta-new">
            <h2>Ready to take control of your healthcare?</h2>
            <p>Join thousands of patients who book smarter with UrgentFlow.</p>
            <Link to="/signup" className="about-btn-primary">Create a free account</Link>
          </section>
        )}

      </main>
      <Footer user={user} />
    </>
  );
}

import "./description.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import description from "../../assets/description.png";

export default function Description() {
  return (
    <section className="desc-wrapper">
      <div className="first-desc-wrapper">
        <p className="subtitle1">We're Always Here When You Need Care</p>
        <h1 className="titlee1">
          Together, We Make HealthCare Faster and More Accessible
        </h1>
        <p className="desc">
          Navigate Your Healthcare Journey with Confidence and Ease.
        </p>
        <p className="desc">Where Medicine Meets Technology for Smarter Care</p>
        <div className="ticks">
          <div className="tick">
            <FontAwesomeIcon icon={faCheck} style={{ color: "#d9ff00" }} />
            <p>Real-Time Queue Updates</p>
          </div>
          <div className="tick">
            <FontAwesomeIcon icon={faCheck} style={{ color: "#d9ff00" }} />
            <p>AI-Powered Patient Prioritization</p>
          </div>
          <div className="tick">
            <FontAwesomeIcon icon={faCheck} style={{ color: "#d9ff00" }} />
            <p>Instant Notifications & Alerts</p>
          </div>
        </div>
      </div>
      <div className="imgg-wrapper">
        <img src={description} alt="health care" />
      </div>
    </section>
  );
}

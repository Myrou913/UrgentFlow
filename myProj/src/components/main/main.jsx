import fourth from "../../assets/4.png";
import fifth from "../../assets/5.png";
import third from "../../assets/3.png";
import sixth from "../../assets/6.png";
import seventh from "../../assets/7.png";
import h1 from "../../assets/health1.png";
import h2 from "../../assets/health2.png";
import h3 from "../../assets/health3.png";
import h4 from "../../assets/health4.png";
import h5 from "../../assets/health5.png";
import hospital from "../../assets/hospital.png";
import surgery from "../../assets/surgery.png";
import form from "../../assets/form.png";
import waiting from "../../assets/waiting.png";
import "./main.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { t } from "../../context/translations.js";

export default function Main({ user }) {
  const { language } = useLanguage();

  const stats = [
    { value: t(language, "stat1"), label: t(language, "stat1Label"), img: fourth },
    { value: t(language, "stat2"), label: t(language, "stat2Label"), img: fifth },
    { value: t(language, "stat3"), label: t(language, "stat3Label"), img: sixth },
    { value: t(language, "stat4"), label: t(language, "stat4Label"), img: seventh },
  ];
  const sponsors1 = [h2, h4, h5];
  const sponsors2 = [h1, h3];
  const steps = [
    { icon: hospital, title: t(language, "step1Title"), description: t(language, "step1Desc") },
    { icon: surgery,  title: t(language, "step2Title"), description: t(language, "step2Desc") },
    { icon: form,     title: t(language, "step3Title"), description: t(language, "step3Desc") },
    { icon: waiting,  title: t(language, "step4Title"), description: t(language, "step4Desc") },
  ];

  return (
    <main>
      <section className="first-wrapper">
        <img className="img" src={third} alt="illustration" />
        <div className="under-first-wrapper">
          <div>
            <h1 className="title">
              {t(language, "heroTitle").split("Healthcare").map((part, i) =>
                i === 0 ? <span key={i}>{part}<span className="span-title">Healthcare</span></span> : <span key={i}>{part}</span>
              )}
            </h1>
            <p className="description">{t(language, "heroDesc")}</p>
          </div>
          {user ? (
            <Link className="get-started" to="/hospitals">
              {t(language, "viewAppointments")} <FontAwesomeIcon icon={faCircleChevronRight} />
            </Link>
          ) : (
            <Link className="get-started" to="/signup">
              {t(language, "getStarted")} <FontAwesomeIcon icon={faCircleChevronRight} />
            </Link>
          )}
        </div>
      </section>
      <section className="second-wrapper">
        <div className="under-second-wrapper1">
          <h3 className="title2">
            {t(language, "bridgeTitle").split("Your Journey Now").map((part, i) =>
              i === 0 ? <span key={i}>{part}<span className="span2">Your Journey Now</span></span> : <span key={i}>{part}</span>
            )}
          </h3>
          <div className="process-button">
            <div className="pill"><a href="#4">{t(language, "ourProcess")}</a></div>
            <div className="play-circle"><a href="#4" className="play-icon"></a></div>
          </div>
          <div className="description-wrapper">
            <p>{t(language, "medicineMeets")}</p>
            <p>{t(language, "onlineHelper")}</p>
          </div>
        </div>
        <div className="under-second-wrapper2">
          {stats.map((item, index) => (
            <div className="card-wrapper" key={index}>
              <div className="text-wrapper">
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
              <img className="img2" src={item.img} alt="stat" />
            </div>
          ))}
        </div>
      </section>
      <section className="third-wrapper">
        <div className="sponsors-wrapper">
          {sponsors1.map((item, index) => (
            <img key={index} className="spons1-img" src={item} alt="sponsor" />
          ))}
          {sponsors2.map((item, index) => (
            <img key={index} className="spons2-img" src={item} alt="sponsors" />
          ))}
        </div>
      </section>
      <section className="fourth-wrapper" id="4">
        <h1>{t(language, "stepsTitle")}</h1>
        <p>{t(language, "stepsDesc")}</p>
        <div className="under-fourth-wrapper">
          {steps.map((item, index) => (
            <div className="step-card-wrapper" key={index}>
              <img className="step-img" src={item.icon} alt="icon" />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

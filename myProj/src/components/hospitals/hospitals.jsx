import "./hospitals.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faAngleLeft, faCirclePlay } from "@fortawesome/free-solid-svg-icons";
import aziza from "../../assets/aziza.png";
import militaire from "../../assets/militaire.png";
import monji from "../../assets/monji.png";
import nicole from "../../assets/nicole.png";
import rabta from "../../assets/rabta.png";
import razi from "../../assets/razi.png";
import thamer from "../../assets/thamer.png";
import ahmed from "../../assets/ahmed.png";
import bizerte from "../../assets/bizerte.png";
import farhat from "../../assets/farhat.png";
import fatouma from "../../assets/fatouma.png";
import gafsa from "../../assets/gafsa.png";
import gbelli from "../../assets/gbelli.png";
import gaserine from "../../assets/gaserine.png";
import habib from "../../assets/habib.png";
import hedi from "../../assets/hedi.png";
import jazar from "../../assets/jazar.png";
import nabel from "../../assets/nabel.png";
import sahloul from "../../assets/sahloul.png";
import taher0 from "../../assets/taher0.png";
import tozeur from "../../assets/tozeur.png";
import zaghouane from "../../assets/zaghouane.png";
import houcine from "../../assets/houcine.png";
import jaballah from "../../assets/jaballah.png";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { t } from "../../context/translations.js";

export default function Hospitals() {
  const { language } = useLanguage();
  const hospitals = [
    { img: nicole, name: "Charles Nicolle Hospital", place: "Tunis" },
    { img: rabta, name: "La Rabta Hospital", place: "Tunis" },
    { img: thamer, name: "Habib Thameur Hospital", place: "Tunis" },
    { img: aziza, name: "Aziza Othmana Hospital", place: "Tunis" },
    { img: razi, name: "Razi Hospital", place: "Manouba" },
    { img: monji, name: "Mongi Slim Hospital", place: "La Marsa" },
    { img: militaire, name: "Military Hospital of Tunis", place: "Tunis" },
    { img: farhat, name: "Farhat Hached Hospital", place: "Sousse" },
    { img: sahloul, name: "Sahloul Hospital", place: "Sousse" },
    { img: habib, name: "Habib Bourguiba Hospital", place: "Sfax" },
    { img: hedi, name: "Hedi Chaker Hospital", place: "Sfax" },
    { img: fatouma, name: "Fattouma Bourguiba Hospital", place: "Monastir" },
    { img: taher0, name: "Tahar Sfar Hospital", place: "Mahdia" },
    { img: nabel, name: "Taher Maamouri Hospital", place: "Nabeul" },
    { img: ahmed, name: "Ahmed Tletli Hospital", place: "Nabeul" },
    { img: bizerte, name: "Bizerte University Hospital", place: "Bizerte" },
    { img: jazar, name: "Ibn El Jazzar Hospital", place: "Kairouan" },
    { img: gaserine, name: "Kasserine Regional Hospital", place: "Kasserine" },
    { img: gafsa, name: "Gafsa Regional Hospital", place: "Gafsa" },
    { img: gbelli, name: "Kebili Regional Hospital", place: "Kebili" },
    { img: tozeur, name: "Tozeur Hospital", place: "Tozeur" },
    { img: zaghouane, name: "Zaghouan Regional Hospital", place: "Zaghouane" },
    {
      img: houcine,
      name: "Houcine Bouzaiene Regional Hospital",
      place: "Gafsa",
    },
    {
      img: jaballah,
      name: "Hedi Jaballah Regional Hospital",
      place: "Tozeur",
    },
  ];
  const [currentIndex, setCurrentIndex] = useState(0);
  const next = () => {
    if (currentIndex + 8 < hospitals.length) {
      setCurrentIndex(currentIndex + 8);
    }
  };
  const prev = () => {
    if (currentIndex - 8 >= 0) {
      setCurrentIndex(currentIndex - 8);
    }
  };
  const itemsPerPage = 8;
  const progressWidth =
    ((currentIndex + itemsPerPage) / hospitals.length) * 100;

  return (
    <section className="hospitals-section">
      <div className="header-container">
        <div className="texts-wrapper">
          <p className="subtitle">{t(language, "findHospital")}</p>
          <h1 className="titlee">{t(language, "dedicatedTitle")}</h1>
        </div>

        <div className="controls-group">
          <div className="arrows">
            <button className="arrow-btn prev" onClick={prev}>
              <FontAwesomeIcon icon={faAngleLeft} />
            </button>
            <button className="arrow-btn next" onClick={next}>
              <FontAwesomeIcon icon={faAngleRight} />
            </button>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.min(progressWidth, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="hospitals-grid">
        {hospitals
          .slice(currentIndex, currentIndex + itemsPerPage)
          .map((item, index) => (
            <div className="hospital-card" key={index}>
              <div className="image-container">
                <img src={item.img} alt={item.name} />
              </div>
              <h3 className="hospital-name">{item.name}</h3>
              <p className="hospital-place">{item.place}</p>
            </div>
          ))}
      </div>

      <div className="footer-action">
        <Link to="/hospitals" className="explore-all-btn">
          {t(language, "exploreAll")} <FontAwesomeIcon icon={faCirclePlay} />
        </Link>
      </div>
    </section>
  );
}

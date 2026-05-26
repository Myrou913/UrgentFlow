import "./searchBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

export default function SearchBar({ setSearch, setSection, search }) {
  return (
    <>
      <div className="search-wrapper">
        <div className="search-bar" style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search hospitals..."
            value={search || ""}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            style={{
              color: "#5e5e5e",
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
            size="xs"
          />
        </div>
        <nav>
          <ul className="sections-wrapper">
            <li className="section-link" onClick={() => setSection("hospital")}>
              Hospitals
            </li>
            <li className="section-link" onClick={() => setSection("clinic")}>
              Clinics
            </li>
            <li className="section-link" onClick={() => setSection("pharmacy")}>
              Pharmacies
            </li>
          </ul>
        </nav>
      </div>
      <hr />
    </>
  );
}

import "./sideBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleUp,
  faAngleDown,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

export default function SideBar({ onFilterChange }) {
  // 1. Move all State declarations to the TOP
  const [filters, setFilters] = useState({
    distance: "",
    availability: "",
    services: [],
  });

  const [openDistance, setOpenDistance] = useState(true);
  const [openAvailability, setOpenAvailability] = useState(true);
  const [openServices, setOpenServices] = useState(true);

  const [openCoreMedicalSpecialties, setOpenCoreMedicalSpecialties] =
    useState(false);
  const [
    openInternalMedecineSubspecialties,
    setOpenInternalMedecineSubspecialties,
  ] = useState(false);
  const [openSurgicalSpecialties, setOpenSurgicalSpecialties] = useState(false);

  // 2. Data Arrays
  const internalMedecineSubspecialties = [
    "Cardiology",
    "Endocrinology",
    "Gastroenterology",
    "Pulmonology / Pneumology",
    "Nephrology",
    "Rheumatology",
    "Hematology",
    "Infectious Diseases",
  ];
  const coreMedicalSpecialties = [
    "General Medecine",
    "Family Medecine",
    "Emergency",
    "Pediatrics",
    "General Surgery",
  ];
  const surgicalSpecialities = [
    "General Surgery",
    "Orthopedic Surgery",
    "Neurosurgery",
    "Cardiothoracic Surgery",
    "Plastic Surgery",
    "Vascular Surgery",
    "Urology",
    "ENT (Ear, Nose, Throat)",
  ];

  // 3. Effect to communicate with parent (Placed after filters is defined)
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  // 4. Handlers
  const handleServiceChange = (value) => {
    setFilters((prev) => {
      const exists = prev.services.includes(value);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((item) => item !== value)
          : [...prev.services, value],
      };
    });
  };

  const resetAll = () => {
    setFilters({ distance: "", availability: "", services: [] });
    setOpenCoreMedicalSpecialties(false);
    setOpenInternalMedecineSubspecialties(false);
    setOpenSurgicalSpecialties(false);
  };

  return (
    <div className="filtre-wrapper">
      {/* HEADER */}
      <div className="filter-texts-wrapper">
        <h4>Filter by</h4>
        <h5 onClick={resetAll}>Clear</h5>
      </div>

      {/* DISTANCE SECTION */}
      <div className="filter-option-wrapper">
        <h3 onClick={() => setOpenDistance(!openDistance)}>
          Distance
          <FontAwesomeIcon
            icon={openDistance ? faAngleUp : faAngleDown}
            size="xs"
          />
        </h3>
        {openDistance && (
          <div className="options-list">
            {["1km", "3km", "5km", "10km"].map((d) => (
              <div className="input-wrapper" key={d}>
                <input
                  type="radio"
                  id={d}
                  name="distance"
                  value={d}
                  checked={filters.distance === d}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      distance: e.target.value,
                    }))
                  }
                />
                <label htmlFor={d}>{d}</label>
              </div>
            ))}
          </div>
        )}
      </div>
      <hr />
      {/* AVAILABILITY SECTION */}
      <div className="filter-option-wrapper">
        <h3 onClick={() => setOpenAvailability(!openAvailability)}>
          Availability
          <FontAwesomeIcon
            icon={openAvailability ? faAngleUp : faAngleDown}
            size="xs"
          />
        </h3>
        {openAvailability && (
          <div className="options-list">
            {[
              { id: "open", val: "open now", label: "Open now" },
              { id: "24/7", val: "24/7", label: "Open 24/7" },
              {
                id: "emergency",
                val: "emergency",
                label: "Emergency available",
              },
            ].map((item) => (
              <div className="input-wrapper" key={item.id}>
                <input
                  type="radio"
                  id={item.id}
                  name="availability"
                  value={item.val}
                  checked={filters.availability === item.val}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      availability: e.target.value,
                    }))
                  }
                />
                <label htmlFor={item.id}>{item.label}</label>
              </div>
            ))}
          </div>
        )}
      </div>
      <hr />
      {/* SPECIALITIES SECTION */}
      <div className="filter-option-wrapper1">
        <h3 onClick={() => setOpenServices(!openServices)}>
          Specialities
          <FontAwesomeIcon
            icon={openServices ? faAngleUp : faAngleDown}
            size="xs"
          />
        </h3>
        {openServices && (
          <div className="options-list">
            {/* 1. Core Medical Specialties Dropdown */}
            <div className="filter-first">
              <div className="input-wrapper">
                <input
                  type="checkbox"
                  id="Core"
                  checked={filters.services.includes(
                    "Core Medical Specialties",
                  )}
                  onChange={() =>
                    handleServiceChange("Core Medical Specialties")
                  }
                />
                <label
                  onClick={() =>
                    setOpenCoreMedicalSpecialties(!openCoreMedicalSpecialties)
                  }
                >
                  Core Medical Specialties
                </label>
              </div>
              {openCoreMedicalSpecialties &&
                coreMedicalSpecialties.map((item, index) => (
                  <div className="drop-down-options" key={index}>
                    <input
                      type="checkbox"
                      id={`core-${index}`}
                      checked={filters.services.includes(item)}
                      onChange={() => handleServiceChange(item)}
                    />
                    <label htmlFor={`core-${index}`}>{item}</label>
                  </div>
                ))}
            </div>
            {/* 2. Internal Medicine Dropdown */}
            <div className="filter-first">
              <div className="input-wrapper">
                <input
                  type="checkbox"
                  id="internal"
                  checked={filters.services.includes(
                    "Internal Medicine Subspecialties",
                  )}
                  onChange={() =>
                    handleServiceChange("Internal Medicine Subspecialties")
                  }
                />
                <label
                  onClick={() =>
                    setOpenInternalMedecineSubspecialties(
                      !openInternalMedecineSubspecialties,
                    )
                  }
                >
                  Internal Medicine Subspecialties
                </label>
              </div>
              {openInternalMedecineSubspecialties &&
                internalMedecineSubspecialties.map((item, index) => (
                  <div className="drop-down-options" key={index}>
                    <input
                      type="checkbox"
                      id={`internal-${index}`}
                      checked={filters.services.includes(item)}
                      onChange={() => handleServiceChange(item)}
                    />
                    <label htmlFor={`internal-${index}`}>{item}</label>
                  </div>
                ))}
            </div>

            {/* 3. Surgical Specialties Dropdown */}
            <div className="filter-first">
              <div className="input-wrapper">
                <input
                  type="checkbox"
                  id="surgery"
                  checked={filters.services.includes("Surgical Specialties")}
                  onChange={() => handleServiceChange("Surgical Specialties")}
                />
                <label
                  onClick={() =>
                    setOpenSurgicalSpecialties(!openSurgicalSpecialties)
                  }
                >
                  Surgical Specialties
                </label>
              </div>
              {openSurgicalSpecialties &&
                surgicalSpecialities.map((item, index) => (
                  <div className="drop-down-options" key={index}>
                    <input
                      type="checkbox"
                      id={`surgical-${index}`}
                      checked={filters.services.includes(item)}
                      onChange={() => handleServiceChange(item)}
                    />
                    <label htmlFor={`surgical-${index}`}>{item}</label>
                  </div>
                ))}
            </div>

            {/* 4. Static Single Items */}
            {[
              "Dentistry",
              "Dermatology",
              "Radiology",
              "Anesthesiology",
              "Oncology",
              "Pathology",
              "Nutrition",
            ].map((item, index) => (
              <div className="input-wrapper" key={index}>
                <input
                  type="checkbox"
                  id={`extra-${index}`}
                  checked={filters.services.includes(item)}
                  onChange={() => handleServiceChange(item)}
                />
                <label htmlFor={`extra-${index}`}>{item}</label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

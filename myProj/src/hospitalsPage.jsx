import Nav from "./components/nav/nav.jsx";
import Footer from "./components/footer/footer.jsx";
import SearchBar from "./components/searchBar/searchBar.jsx";
import SideBar from "./components/sideBar/sideBar.jsx";
import HealthCare from "./components/healthCare/healthCare.jsx";
import { useState } from "react";

function HospitalsPage({user, setUser}) {
  const [filters, setFilters] = useState({
    distance: "",
    availability: "",
    services: [],
  });
  const [search, setSearch] = useState("");
  const [section, setSection] = useState("");
  return (
    <div>
      <Nav user={user} setUser={setUser}/>
      <SearchBar search={search} setSearch={setSearch} setSection={setSection}/>
      <div style={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
        <SideBar onFilterChange={setFilters} />
        <HealthCare filters={filters} search={search} section={section} setSearch={setSearch} setSection={setSection} user={user}/>
      </div>
      <Footer user={user} />
    </div>
  );
}

export default HospitalsPage;

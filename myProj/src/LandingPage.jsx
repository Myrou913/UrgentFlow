import Description from "./components/description/description.jsx";
import Feedback from "./components/feedback/feedback.jsx";
import Hospitals from "./components/hospitals/hospitals.jsx";
import Main from "./components/main/main.jsx";
import Nav from "./components/nav/nav.jsx";
import Footer from "./components/footer/footer.jsx";

function LandingPage({ user, setUser }) {
  return (
    <div>
      <Nav user={user} setUser={setUser} />
      <Main user={user} />
      <Hospitals />
      <Description />
      <Feedback />
      <Footer user={user} />
    </div>
  );
}

export default LandingPage;

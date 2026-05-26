import "./App.css";
import CreateAccount from "./components/createAccount/createAccount.jsx";
import ForgetPassword from "./components/forgetPass/forgetPass.jsx";
import SignIn from "./components/signIn/signIn.jsx";
import LandingPage from "./LandingPage.jsx";
import HospitalsPage from "./hospitalsPage.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ScrollToTop from "./scrollToTop.jsx";
import BookAppointment from "./components/bookApp/bookApp.jsx";
import ThankYouPage from "./components/thankyou/thankyou.jsx";
import { useState } from "react";
import UserProfile from "./userProfile.jsx";
import ProfilePage from "./components/profilePage/profilePage.jsx";
import { getStoredUser } from "./utils/auth.js";
import AppointmentsPage from "./pages/appointmentsPage.jsx";
import HistoryPage from "./pages/historyPage.jsx";
import SettingsPage from "./pages/settingsPage.jsx";
import NotificationsPage from "./pages/notificationsPage.jsx";
import AboutPage from "./pages/aboutPage.jsx";
import EmergencyPage from "./pages/emergencyPage.jsx";
import AdminDashboardPage from "./pages/adminDashboardPage.jsx";
import AdminArchivesPage from "./pages/adminArchivesPage.jsx";
import SuperAdminPage from "./pages/superAdminPage.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  return (
    <LanguageProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage user={user} setUser={setUser} />} />
          <Route path="/login" element={<SignIn setUser={setUser} />} />
          <Route path="/signup" element={<CreateAccount setUser={setUser} />} />
          <Route path="/forget" element={<ForgetPassword />} />
          <Route path="/hospitals" element={<HospitalsPage user={user} setUser={setUser} />} />
          <Route path="/form" element={<BookAppointment />} />
          <Route path="/thankyou" element={<ThankYouPage />} />
          <Route path="/userprofile" element={<UserProfile />} />
          <Route path="/profile" element={<ProfilePage setUser={setUser} />} />
          <Route path="/appointments" element={<AppointmentsPage setUser={setUser} />} />
          <Route path="/history" element={<HistoryPage setUser={setUser} />} />
          <Route path="/settings" element={<SettingsPage setUser={setUser} />} />
          <Route path="/notifications" element={<NotificationsPage setUser={setUser} />} />
          <Route path="/admin" element={<AdminDashboardPage setUser={setUser} />} />
          <Route path="/admin/archives" element={<AdminArchivesPage setUser={setUser} />} />
          <Route path="/super-admin" element={<SuperAdminPage setUser={setUser} />} />
          <Route path="/about" element={<AboutPage setUser={setUser} />} />
          <Route path="/emergency" element={<EmergencyPage setUser={setUser} />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;

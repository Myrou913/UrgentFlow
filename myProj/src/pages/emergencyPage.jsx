import { useEffect, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import Footer from "../components/footer/footer.jsx";
import "./infoPages.css";
import { getStoredUser } from "../utils/auth.js";
import { triggerEmergencyRequest } from "../utils/appointments.js";
import emergencyImg from "../assets/Emergency.png";

export default function EmergencyPage({ setUser }) {
  const user = getStoredUser();
  const [requestSent, setRequestSent] = useState(false);
  const [requestTime, setRequestTime] = useState("");
  const [requestDetails, setRequestDetails] = useState("");

  useEffect(() => {
    if (!requestSent) return undefined;

    const timeoutId = window.setTimeout(() => {
      setRequestSent(false);
      setRequestTime("");
      setRequestDetails("");
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [requestSent]);

  const handleEmergencyCall = async () => {
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const currentPosition = await new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

    const response = await triggerEmergencyRequest({
      userId: user?.id || null,
      user_id: user?.id || null,
      patient_name: user?.fullName || "Guest user",
      patient_phone: user?.phone || "",
      patient_email: user?.email || "",
      city: user?.city || "",
      lat: currentPosition?.lat ?? null,
      lng: currentPosition?.lng ?? null,
      requested_at: now.toISOString(),
      status: "call-requested",
    });

    setRequestSent(true);
    setRequestTime(formattedTime);
    setRequestDetails(
      response.emergencyRequest?.hospital_name
        ? `Nearest emergency hospital notified: ${response.emergencyRequest.hospital_name}.`
        : "The emergency request was saved and will appear in the emergency admin dashboard.",
    );
  };

  return (
    <>
      <Nav user={user} setUser={setUser} />
      <main className="info-page emergency-page">
        <section className="info-hero emergency-hero">
          <div className="info-hero-copy">
            <span className="info-badge info-badge-danger">Emergency</span>
            <h1>Need urgent help right now?</h1>
            <p>
              Use the emergency request button below to trigger a hospital
              callback request. If the situation is critical, always contact
              your local emergency services immediately as well.
            </p>
            <div className="emergency-tips">
              <span>📱 Keep your phone nearby</span>
              <span>🗣️ Be ready to explain clearly</span>
              <span>🚨 Call 190 for immediate danger</span>
            </div>
            <button className="emergency-button" onClick={handleEmergencyCall}>
              Request Emergency Hospital Call
            </button>

            {requestSent && (
              <div className="emergency-confirmation">
                Emergency request recorded at {requestTime}. Keep your phone
                close so the hospital can reach you. {requestDetails}
              </div>
            )}
          </div>
          <div className="emergency-image-box">
            <img src={emergencyImg} alt="Emergency" className="emergency-hero-img" />
          </div>
        </section>
      </main>
      <Footer user={user} />
    </>
  );
}

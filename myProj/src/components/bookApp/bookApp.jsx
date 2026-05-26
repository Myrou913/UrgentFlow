import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Select from "react-select";
import {
  faArrowLeft,
  faPhone,
  faEnvelope,
  faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import "./bookApp.css";
import {
  cacheAppointments,
  createLocalAppointment,
  saveNotificationLocally,
} from "../../utils/appointments.js";
import { getStoredUser } from "../../utils/auth.js";

export default function BookAppointment() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = getStoredUser();
  const [errors, setErrors] = useState({});
  const [name, setName] = useState(() => getStoredUser()?.fullName || "");
  const [email, setEmail] = useState(() => getStoredUser()?.email || "");
  const [phone, setPhone] = useState(() => getStoredUser()?.phone || "");
  const [date, setDate] = useState(new Date());
  const [selectedService, setSelectedService] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const passedHospital = location.state?.hospital || {};
  const hospital = {
    id: passedHospital.id,
    name: passedHospital.name || "Healthcare Center",
    services:
      typeof passedHospital.services === "string"
        ? passedHospital.services.split(",").map((service) => service.trim())
        : Array.isArray(passedHospital.services)
          ? passedHospital.services
          : [],
  };

  const serviceOptions = hospital.services.map((service) => ({
    value: service,
    label: service,
  }));

  const isEmergencyService = useMemo(
    () => String(selectedService || "").trim().toLowerCase().includes("emergency"),
    [selectedService],
  );

  const bookingWindow = useMemo(() => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const opensAt = 7 * 60;
    const closesAt = 23 * 60;

    return {
      isOpen: totalMinutes >= opensAt && totalMinutes < closesAt,
      label: "Booking is available only between 07:00 and 12:00.",
    };
  }, [currentTime]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!message.text) return undefined;

    const timeoutId = window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    if (!isEmergencyService && symptoms) {
      setSymptoms("");
    }
  }, [isEmergencyService, symptoms]);

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      height: 42,
      borderRadius: "10px",
      borderColor: state.isFocused ? "#0062ff" : "#bfbaba",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(0,98,255,0.15)" : "none",
      "&:hover": { borderColor: "#0062ff" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 12px" }),
    placeholder: (base) => ({ ...base, color: "#999" }),
    menu: (base) => ({ ...base, borderRadius: "10px", overflow: "hidden" }),
  };

  const validateEmail = (value) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  const validatePhoneNumber = (value) => /^[2459]\d{7}$/.test(value);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    setMessage({ type: "", text: "" });
    const user = getStoredUser();

    if (!user || !user.id) {
      setMessage({
        type: "error",
        text: "You need to log in before booking an appointment.",
      });
      return;
    }

    const nextErrors = {};
    if (!name) nextErrors.name = "Full Name is required";
    if (!validatePhoneNumber(phone)) {
      nextErrors.phone = "Valid Phone Number is required";
    }
    if (!validateEmail(email)) {
      nextErrors.email = "Valid Email Address is required";
    }
    if (!selectedService) {
      nextErrors.service = "Service is required";
    }
    if (!bookingWindow.isOpen) {
      nextErrors.bookingWindow = bookingWindow.label;
    }
    if (isEmergencyService && !symptoms.trim()) {
      nextErrors.symptoms = "Symptoms are required for emergency bookings";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      user_id: user.id,
      hospital_id: hospital.id || hospital.name,
      hospital_name: hospital.name,
      hospital_city: passedHospital.city || user.city || "",
      hospital_type: passedHospital.type || "hospital",
      service: selectedService,
      appointment_date: [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-"),
      notes: isEmergencyService ? symptoms.trim() : "",
    };

    try {
      const response = await fetch("http://localhost:5000/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!data.success) {
        const localAppointment = createLocalAppointment({
          ...payload,
          hospital_name: hospital.name,
          name,
          email,
          phone,
        });

        setMessage({
          type: "success",
          text: `${data.message || "The server could not confirm the booking."} A local appointment was created instead. Turn ${localAppointment.turn_number}, estimated wait ${localAppointment.estimated_time} min.`,
        });
        setTimeout(() => navigate("/thankyou"), 900);
        return;
      }

      const savedAppointment = {
        id: data.appointment?.id || `remote-${Date.now()}`,
        ...payload,
        hospital_name: hospital.name,
        name,
        email,
        phone,
        status: data.appointment?.status || "upcoming",
        turn_number: data.turn_number,
        estimated_time: data.estimated_time,
        created_at: data.appointment?.created_at || new Date().toISOString(),
      };

      cacheAppointments([savedAppointment]);
      saveNotificationLocally({
        user_id: user.id,
        appointment_id: savedAppointment.id,
        title: "Appointment booked",
        body: `${hospital.name} confirmed your appointment. Turn #${data.turn_number}, estimated wait ${data.estimated_time} min.`,
        kind: "appointment",
      });

      setMessage({
        type: "success",
        text: `Appointment booked successfully. Turn ${data.turn_number}, estimated wait ${data.estimated_time} min.`,
      });
      setTimeout(() => navigate("/thankyou"), 900);
    } catch (error) {
      console.warn("Backend booking unavailable, saving locally.", error);

      const localAppointment = createLocalAppointment({
        ...payload,
        hospital_name: hospital.name,
        name,
        email,
        phone,
      });

      setMessage({
        type: "success",
        text: `Server unavailable. A local appointment was created instead. Turn ${localAppointment.turn_number}, estimated wait ${localAppointment.estimated_time} min.`,
      });
      setTimeout(() => navigate("/thankyou"), 900);
    }
  };

  return (
    <div className="booking-page-container">
      <Link to="/hospitals" className="back-btn">
        <FontAwesomeIcon icon={faArrowLeft} size="xl" />
      </Link>

      <h1 className="main-title">Book Appointment at {hospital.name}</h1>

      <div className="booking-card">
        {message.text && (
          <div className={`booking-notice ${message.type}`}>{message.text}</div>
        )}
        <div className="booking-grid">
          <div className="details-column">
            <section className="input-section">
              <h3>Client Details</h3>
              <div className="field">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                {errors.name && <p className="error">{errors.name}</p>}
              </div>
              <div className="field">
                <label>Phone Number</label>
                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faPhone} className="inner-icon" />
                  <input
                    type="text"
                    placeholder="XX XXX XXX"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
                {errors.phone && <p className="error">{errors.phone}</p>}
              </div>
              <div className="field">
                <label>Email</label>
                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faEnvelope} className="inner-icon" />
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                {errors.email && <p className="error">{errors.email}</p>}
              </div>
            </section>

            <section className="service-section">
              <label htmlFor="service">Select Service</label>
              {hospital.services.length > 0 ? (
                <>
                  <Select
                    options={serviceOptions}
                    styles={customSelectStyles}
                    placeholder="Choose a service"
                    onChange={(selected) => setSelectedService(selected?.value || "")}
                  />
                  {errors.service && <p className="error">{errors.service}</p>}
                </>
              ) : (
                <p>No services available for this center.</p>
              )}
              <p className="info-text">
                <FontAwesomeIcon icon={faCircleInfo} /> Only today's bookings
                are allowed, and only between 07:00 and 12:00.
              </p>
              {errors.bookingWindow && (
                <p className="error">{errors.bookingWindow}</p>
              )}
              {!bookingWindow.isOpen && (
                <p className="booking-window-note">{bookingWindow.label}</p>
              )}
              {isEmergencyService && (
                <div className="field emergency-symptoms-field">
                  <label htmlFor="symptoms">Symptoms</label>
                  <textarea
                    id="symptoms"
                    placeholder="Describe the symptoms you have."
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                  />
                  {errors.symptoms && <p className="error">{errors.symptoms}</p>}
                </div>
              )}
            </section>

            <button
              onClick={handleSubmit}
              className="submit-btn"
              disabled={
                !selectedService ||
                !name ||
                !phone ||
                !email ||
                !bookingWindow.isOpen ||
                (isEmergencyService && !symptoms.trim())
              }
            >
              Confirm Place
            </button>
          </div>

          <div className="calendar-column">
            <h3>Date</h3>
            <div className="calendar-box">
              <Calendar
                onChange={setDate}
                value={date}
                minDate={new Date()}
                maxDate={new Date()}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import "./createAccount.css";
import login from "../../assets/login.png";
import google from "../../assets/google.png";
import apple from "../../assets/apple.png";
import facebook from "../../assets/facebook.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faCircleExclamation,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import Select from "react-select";
import {
  registerMockUser,
} from "../../utils/auth.js";

export default function SignUp() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [passRequirements, setPassRequirements] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    date: "",
    bloodType: null,
    diseases: [],
    gender: "",
    allergies: "",
    password: "",
    confirmPassword: "",
  });

  const handleSocialSignUp = (provider) => {
    const providerName =
      provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
    setMessage({
      type: "error",
      text: `${providerName} sign-up is not configured yet. Real social auth needs provider app credentials and redirect/callback setup first.`,
    });
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      height: 42,
      borderRadius: "10px",
      borderColor: state.isFocused ? "#0062ff" : "#bfbaba",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(0,98,255,0.15)" : "none",
      "&:hover": {
        borderColor: "#0062ff",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 12px",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#999",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "10px",
      overflow: "hidden",
    }),
  };

  const bloodTypeOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];

  const diseasesOptions = [
    { value: "none", label: "None" },
    { value: "Hypertension", label: "Hypertension" },
    { value: "Heart Disease", label: "Heart Disease" },
    { value: "Arrhythmia", label: "Arrhythmia" },
    { value: "Diabetes", label: "Diabetes" },
    { value: "Asthma", label: "Asthma" },
    {
      value: "Chronic Obstructive Pulmonary Disease",
      label: "Chronic Obstructive Pulmonary Disease",
    },
    { value: "Epilepsy", label: "Epilepsy" },
    { value: "Stroke history", label: "Stroke history" },
    { value: "Cancer", label: "Cancer" },
    { value: "Kidney Disease", label: "Kidney Disease" },
    { value: "Liver Disease", label: "Liver Disease" },
    { value: "Other", label: "Other" },
  ];

  const validatePassword = (password) =>
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const validatePhoneNumber = (phone) =>
    phone.length === 8 && /^[2459]\d{7}$/.test(phone);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleNext = (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    const nextErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = "Full Name is required";
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        nextErrors.email = "Valid email is required";
      }
      if (!formData.phone.trim() || !validatePhoneNumber(formData.phone)) {
        nextErrors.phone = "Valid phone is required";
      }
      if (!formData.city.trim()) nextErrors.city = "City is required";
      if (!formData.address.trim()) nextErrors.address = "Address is required";
    }

    if (step === 2) {
      if (!formData.date) nextErrors.date = "Date of birth is required";
      if (!formData.gender) nextErrors.gender = "Gender is required";
      if (!formData.diseases || formData.diseases.length === 0) {
        nextErrors.diseases = "Select at least one disease";
      }
    }

    if (step === 3) {
      if (!validatePassword(formData.password)) {
        nextErrors.password = "Password does not meet requirements";
      }
      if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    if (step < 3) setStep((prev) => prev + 1);
  };

  const handleBack = (event) => {
    event.preventDefault();
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async (event) => {
    if (event) event.preventDefault();
    setMessage({ type: "", text: "" });

    const nextErrors = {};
    if (!validatePassword(formData.password)) {
      nextErrors.password = "Password does not meet requirements";
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage({
          type: "error",
          text: data.message || "We could not create the account right now.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Account created successfully. Redirecting to sign in...",
      });
      setTimeout(() => navigate("/login"), 900);
    } catch {
      const fallback = registerMockUser(formData);

      if (!fallback.success) {
        setMessage({ type: "error", text: fallback.message });
        return;
      }

      setMessage({
        type: "success",
        text: "Account created locally. Redirecting to sign in...",
      });
      setTimeout(() => navigate("/login"), 900);
    }
  };

  return (
    <div className="all-page-container1">
      <div className="first-part-container1">
        <img src={login} alt="login illustration" />
        <p>
          {" "}
          'Access your emergency services and hospital appointments{" "}
          <span className="span2">instantly</span> .'
        </p>
      </div>
      <div className="second-part-container1">
        <div className="icon-wrapper1">
          {step > 1 && (
            <button type="button" onClick={handleBack} className="btn-secondary">
              <FontAwesomeIcon
                icon={faArrowLeftLong}
                size="2xl"
                style={{ color: "#000" }}
              />
            </button>
          )}
          <div className="texts-wrapper1 signup-heading">
            <h1>{step === 1 ? "Welcome" : "Create your account"}</h1>
            <p>Sign up to UrgentFlow</p>
          </div>
        </div>

        <div className="steps-wrapper">
          <div className={`step ${step === 1 ? "active" : ""}`}></div>
          <div className={`step ${step === 2 ? "active" : ""}`}></div>
          <div className={`step ${step === 3 ? "active" : ""}`}></div>
        </div>

        <form className="form-wrapper1" onSubmit={(event) => event.preventDefault()}>
          {message.text && (
            <div className={`form-notice ${message.type}`}>{message.text}</div>
          )}

          {step === 1 && (
            <div className="label-wrapper1">
              <label htmlFor="fullName">
                Full Name <span>*</span>
              </label>
              <input
                value={formData.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                type="text"
                name="fullName"
                id="fullName"
                placeholder="Full Name"
              />
              {errors.fullName && <p className="error">{errors.fullName}</p>}

              <label htmlFor="email">
                Email <span>*</span>
              </label>
              <input
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                type="email"
                placeholder="Email"
                id="email"
              />
              {errors.email && <p className="error">{errors.email}</p>}

              <label htmlFor="phone">
                Phone <span>*</span>
              </label>
              <input
                value={formData.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                type="tel"
                id="phone"
                placeholder="+216 XX XXX XXX"
              />
              {errors.phone && <p className="error">{errors.phone}</p>}

              <label htmlFor="city">
                City <span>*</span>
              </label>
              <input
                value={formData.city}
                onChange={(event) => updateField("city", event.target.value)}
                type="text"
                id="city"
                placeholder="City"
              />
              {errors.city && <p className="error">{errors.city}</p>}

              <label htmlFor="address">
                Address <span>*</span>
              </label>
              <input
                value={formData.address}
                onChange={(event) => updateField("address", event.target.value)}
                type="text"
                id="address"
                placeholder="Address"
              />
              {errors.address && <p className="error">{errors.address}</p>}
            </div>
          )}

          {step === 2 && (
            <div className="label-wrapper2">
              <label htmlFor="date">
                Date of birth <span>*</span>
              </label>
              <input
                value={formData.date}
                onChange={(event) => updateField("date", event.target.value)}
                type="date"
                name="date"
                id="date"
              />
              {errors.date && <p className="error">{errors.date}</p>}

              <label>Blood Type</label>
              <Select
                options={bloodTypeOptions}
                styles={customSelectStyles}
                placeholder="Select Blood Type"
                onChange={(value) => setFormData((prev) => ({ ...prev, bloodType: value }))}
              />

              <div className="rem1">
                <label>
                  Gender <span>*</span>
                </label>
                <div>
                  <input
                    onChange={(event) => updateField("gender", event.target.value)}
                    checked={formData.gender === "male"}
                    type="radio"
                    name="gender"
                    value="male"
                    id="male"
                  />
                  <p>Male</p>
                </div>
                <div>
                  <input
                    onChange={(event) => updateField("gender", event.target.value)}
                    checked={formData.gender === "female"}
                    type="radio"
                    name="gender"
                    value="female"
                    id="female"
                  />
                  <p>Female</p>
                </div>
              </div>
              {errors.gender && <p className="error">{errors.gender}</p>}

              <label>
                Chronic Diseases <span>*</span>
              </label>
              <Select
                options={diseasesOptions}
                styles={customSelectStyles}
                placeholder="Chronic Diseases"
                isMulti
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, diseases: value }));
                  setErrors((prev) => ({ ...prev, diseases: "" }));
                }}
              />
              {errors.diseases && <p className="error">{errors.diseases}</p>}

              <label htmlFor="allergies">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(event) => updateField("allergies", event.target.value)}
                id="allergies"
                placeholder="List any allergies..."
              ></textarea>
            </div>
          )}

          {step === 3 && (
            <div className="label-wrapper1">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  value={formData.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;"
                  id="password"
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="password-visual"
                />
              </div>
              {errors.password && <p className="error">{errors.password}</p>}

              <div>
                <p className="pass-requ" onClick={() => setPassRequirements((prev) => !prev)}>
                  <FontAwesomeIcon className="info" icon={faCircleExclamation} />
                  Password requirements:
                </p>
                {passRequirements && (
                  <div className="password-rules">
                    <ul>
                      <li>At least 8 characters</li>
                      <li>A lowercase letter</li>
                      <li>An uppercase letter</li>
                      <li>A number</li>
                      <li>At least one special character</li>
                      <li>Password should be case-sensitive</li>
                      <li>Password should not match your email</li>
                    </ul>
                  </div>
                )}
              </div>

              <label htmlFor="verifyPassword">Confirm password</label>
              <div className="password-input-wrapper">
                <input
                  value={formData.confirmPassword}
                  onChange={(event) =>
                    updateField("confirmPassword", event.target.value)
                  }
                  type={showConfirm ? "text" : "password"}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;"
                  id="verifyPassword"
                />
                <FontAwesomeIcon
                  icon={showConfirm ? faEyeSlash : faEye}
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="password-visual"
                />
              </div>
              {errors.confirmPassword && (
                <p className="error">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <div className="buttons-row">
            <button
              type="button"
              onClick={step === 3 ? handleSubmit : handleNext}
              className="btn-login1"
            >
              {step === 3 ? "Create Account" : "Next"}
            </button>
          </div>
        </form>

        <p className="dont-have-account1">
          Already have an account?{" "}
          <Link className="link" to="/login">
            Sign in
          </Link>
        </p>
        <div className="divider">
          <span>Or connect using</span>
        </div>
        <div className="social-wrapper1">
          <button type="button" className="social-btn" onClick={() => handleSocialSignUp("google")}>
            <img src={google} alt="google icon" />
          </button>
          <button type="button" className="social-btn" onClick={() => handleSocialSignUp("facebook")}>
            <img src={facebook} alt="facebook icon" />
          </button>
          <button type="button" className="social-btn" onClick={() => handleSocialSignUp("apple")}>
            <img src={apple} alt="apple icon" />
          </button>
        </div>
      </div>
      <Link to="/" className="close-btn1">
        &times;
      </Link>
    </div>
  );
}

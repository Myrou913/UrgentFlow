import "./forgetPass.css";
import forgot from "../../assets/forget.png";
import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeftLong,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import { updateMockPassword } from "../../utils/auth.js";

export default function ForgetPassword() {
  const [step, setStep] = useState(1);
  const inputsRef = useRef([]);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (step !== 2 || canResend) return undefined;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, canResend]);

  const validatePassword = (password) =>
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const validateEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const handleBack = (event) => {
    event.preventDefault();
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleNext = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    const nextErrors = {};

    if (step === 1) {
      if (!formData.email.trim() || !validateEmail(formData.email)) {
        nextErrors.email = "Valid email is required";
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/send-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await response.json();

        if (!data.success) {
          setErrors({ email: data.message || "Error sending code" });
          return;
        }
      } catch {
        setMessage({
          type: "success",
          text: "Server unavailable. Use code 1234 to continue with local recovery.",
        });
      }
    }

    if (step === 2) {
      if (formData.code.length !== 4 || !/^\d{4}$/.test(formData.code)) {
        nextErrors.code = "Enter the 4-digit code";
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            code: formData.code,
          }),
        });
        const data = await response.json();

        if (!data.success) {
          setErrors({ code: data.message || "Invalid code" });
          return;
        }
      } catch {
        if (formData.code !== "1234") {
          setErrors({
            code: "Use 1234 while the local recovery mode is active.",
          });
          return;
        }
      }
    }

    if (step === 3) {
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
    }

    setErrors({});
    if (step < 3) {
      const nextStep = step + 1;
      if (nextStep === 2) {
        setTimer(30);
        setCanResend(false);
      }
      setStep(nextStep);
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
      const response = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage({
          type: "error",
          text: "We could not reset the password right now.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Password updated successfully. Redirecting to sign in...",
      });
      setTimeout(() => navigate("/login"), 900);
    } catch {
      const fallback = updateMockPassword(formData.email, formData.password);

      if (!fallback.success) {
        setMessage({ type: "error", text: fallback.message });
        return;
      }

      setMessage({
        type: "success",
        text: "Password updated locally. Redirecting to sign in...",
      });
      setTimeout(() => navigate("/login"), 900);
    }
  };

  return (
    <div className="all-page-container">
      <div className="first-part-container">
        <img src={forgot} alt="login illustration" />
        <p>
          {" "}
          'Access your emergency services and hospital appointments{" "}
          <span className="span2">instantly</span> .'
        </p>
      </div>
      <div className="second-part-container">
        <div className="icon-wrapper">
          <div className="texts-wrapper">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary"
              >
                <FontAwesomeIcon
                  icon={faArrowLeftLong}
                  size="2xl"
                  style={{ color: "#000" }}
                />
              </button>
            )}
            <h1>Forgot Password</h1>
            <p>Create New Password</p>
          </div>
        </div>
        <div className="steps-wrapper">
          <div className={`step ${step === 1 ? "active" : ""}`}></div>
          <div className={`step ${step === 2 ? "active" : ""}`}></div>
          <div className={`step ${step === 3 ? "active" : ""}`}></div>
        </div>
        <form
          className="form-wrapper"
          onSubmit={step === 3 ? handleSubmit : handleNext}
        >
          {message.text && (
            <div className={`form-notice ${message.type}`}>{message.text}</div>
          )}
          {step === 1 && (
            <div className="label-wrapper1">
              <label htmlFor="email">Send Code</label>
              <input
                value={formData.email}
                onChange={(event) => {
                  setFormData({ ...formData, email: event.target.value });
                  setErrors({ ...errors, email: "" });
                }}
                type="email"
                id="email"
                placeholder="Email"
              />
              {errors.email && <p className="error">{errors.email}</p>}
              <p className="error" style={{ color: "#999" }}>
                Please enter your email account to send the verification code to
                reset your password
              </p>
              <button className="btn-login1" onClick={handleNext}>
                Send Code
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="label-wrapper1">
              <label htmlFor="code">Input Code</label>
              <div className="code-wrapper">
                {[0, 1, 2, 3].map((_, index) => (
                  <input
                    ref={(element) => (inputsRef.current[index] = element)}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "100%",
                    }}
                    key={index}
                    type="text"
                    maxLength="1"
                    inputMode="numeric"
                    className="otp-input"
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "");
                      const codeArray = formData.code.padEnd(4, " ").split("");
                      codeArray[index] = value;

                      const newCode = codeArray.join("").trim();
                      setFormData({
                        ...formData,
                        code: newCode,
                      });

                      if (value && index < 3) {
                        inputsRef.current[index + 1].focus();
                      }

                      setErrors({ ...errors, code: "" });
                    }}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Backspace" &&
                        !formData.code[index] &&
                        index > 0
                      ) {
                        inputsRef.current[index - 1].focus();
                      }
                    }}
                  />
                ))}
              </div>
              <p className="error" style={{ color: "#999" }}>
                Didn't receive it?{" "}
                {canResend ? (
                  <span
                    style={{ color: "#0062ff", cursor: "pointer" }}
                    onClick={() => {
                      setTimer(30);
                      setCanResend(false);
                    }}
                  >
                    Resend Code
                  </span>
                ) : (
                  <span>Resend in {timer}s</span>
                )}
              </p>
              <button
                onClick={handleNext}
                className="btn-login1"
                disabled={formData.code.length !== 4}
              >
                Next
              </button>
            </div>
          )}
          {step === 3 && (
            <div className="label-wrapper1">
              <label htmlFor="password">Password</label>
              <div
                className="password-input-wrapper"
                style={{ position: "relative" }}
              >
                <input
                  value={formData.password}
                  onChange={(event) => {
                    setFormData({ ...formData, password: event.target.value });
                    setErrors({ ...errors, password: "" });
                  }}
                  type={showPassword ? "text" : "password"}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;"
                  id="password"
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#999",
                  }}
                />
              </div>
              {errors.password && <p className="error">{errors.password}</p>}
              <label htmlFor="verifyPassword">Confirm password</label>
              <div
                className="password-input-wrapper"
                style={{ position: "relative" }}
              >
                <input
                  value={formData.confirmPassword}
                  onChange={(event) => {
                    setFormData({
                      ...formData,
                      confirmPassword: event.target.value,
                    });
                    setErrors({ ...errors, confirmPassword: "" });
                  }}
                  type={showConfirm ? "text" : "password"}
                  placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;"
                  id="verifyPassword"
                />
                <FontAwesomeIcon
                  icon={showConfirm ? faEyeSlash : faEye}
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    cursor: "pointer",
                    color: "#999",
                  }}
                />
              </div>
              {errors.confirmPassword && (
                <p className="error">{errors.confirmPassword}</p>
              )}
              <div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-login1"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="btn-login2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <Link to="/" className="close-btn">
        &times;
      </Link>
    </div>
  );
}

import "./signIn.css";
import login from "../../assets/login.png";
import google from "../../assets/google.png";
import apple from "../../assets/apple.png";
import facebook from "../../assets/facebook.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  authenticateMockUser,
  setStoredUser,
} from "../../utils/auth.js";

export default function SignIn({ setUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSocialSignIn = (provider) => {
    const providerName =
      provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
    setMessage({
      type: "error",
      text: `${providerName} sign-in is not configured yet. Real social login needs OAuth provider credentials, redirect URLs, and consent-screen setup.`,
    });
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        setMessage({
          type: "error",
          text: data.message || "Invalid credentials.",
        });
        return;
      }

      setStoredUser(data.user, rememberMe);
      setUser(data.user);
      navigate(
        data.user.role === "super_admin"
          ? "/super-admin"
          : data.user.role === "admin"
            ? "/admin"
            : "/appointments",
      );
    } catch (error) {
      console.warn(
        "Backend login unavailable, using browser storage fallback.",
        error,
      );

      const fallback = authenticateMockUser(email, password);

      if (!fallback.success) {
        setMessage({ type: "error", text: fallback.message });
        return;
      }

      setStoredUser(fallback.user, rememberMe);
      setUser(fallback.user);
      navigate(
        fallback.user.role === "super_admin"
          ? "/super-admin"
          : fallback.user.role === "admin"
            ? "/admin"
            : "/appointments",
      );
    }
  };

  return (
    <div className="all-page-container">
      <div className="first-part-container">
        <img src={login} alt="login illustration" />
        <p>
          {" "}
          'Access your emergency services and hospital appointments{" "}
          <span className="span2">instantly</span> .'
        </p>
      </div>
      <div className="second-part-container">
        <div className="icon-wrapper">
          <div className="texts-wrapper">
            <h1>Welcome back</h1>
            <p>Sign in to UrgentFlow</p>
          </div>
        </div>
        <form className="form-wrapper" onSubmit={handleLogin}>
          {message.text && (
            <div className={`form-notice ${message.type}`}>{message.text}</div>
          )}
          <div className="label-wrapper">
            <label htmlFor="details">Enter Details</label>
            <input
              type="text"
              name="details"
              id="details"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="rem">
            <div>
              <input
                type="checkbox"
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <p>Remember me</p>
            </div>
            <Link className="links" to="/forget">
              Forgot Password?
            </Link>
          </div>
          <button className="btn-login">Login</button>
        </form>
        <p className="dont-have-account">
          Don't have an account?{" "}
          <Link className="link" to="/signup">
            Create an account
          </Link>
        </p>
        <div className="divider">
          <span>Or connect using</span>
        </div>
        <div className="social-wrapper">
          <button type="button" className="social-btn" onClick={() => handleSocialSignIn("google")}>
            <img src={google} alt="google icon" />
          </button>
          <button type="button" className="social-btn" onClick={() => handleSocialSignIn("facebook")}>
            <img src={facebook} alt="facebook icon" />
          </button>
          <button type="button" className="social-btn" onClick={() => handleSocialSignIn("apple")}>
            <img src={apple} alt="apple icon" />
          </button>
        </div>
      </div>
      <Link to="/" className="close-btn">
        &times;
      </Link>
    </div>
  );
}

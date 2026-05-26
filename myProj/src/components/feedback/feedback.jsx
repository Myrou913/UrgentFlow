import "./feedback.css";
import feedback from "../../assets/feedback.png";
import angry from "../../assets/angry.png";
import ok from "../../assets/ok.png";
import happy from "../../assets/happy.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../utils/auth.js";

export default function Feedback() {
  const navigate = useNavigate();
  const [rating, setRating] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ type: "", text: "" });

  const handleSubmit = async () => {
    const user = getStoredUser();

    if (!user?.id) {
      setStatus({
        type: "error",
        text: "Please sign in first so we can save your feedback to your account.",
      });
      setTimeout(() => navigate("/login"), 900);
      return;
    }

    if (!rating) {
      setStatus({
        type: "error",
        text: "Select the reaction that matches your experience first.",
      });
      return;
    }

    if (!message.trim()) {
      setStatus({
        type: "error",
        text: "Write your feedback before sending it.",
      });
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, rating, message }),
      });
      const data = await response.json();

      if (!data.success) {
        setStatus({
          type: "error",
          text: data.message || "We could not save your feedback right now.",
        });
        return;
      }

      setStatus({
        type: "success",
        text: "Your feedback was sent successfully. Thank you for helping us improve UrgentFlow.",
      });
      setRating("");
      setMessage("");
    } catch (error) {
      console.warn("Feedback submission failed", error);
      setStatus({
        type: "error",
        text: "Network error. Please try again in a moment.",
      });
    }
  };

  return (
    <section className="feedback-wrapper">
      <img className="feedback-img" src={feedback} alt="feedback picture" />
      <div className="elements-wrapper">
        <div className="feedback-texts">
          <h1>Help Us Improve</h1>
          <p>Your feedback helps us improve healthcare access for everyone.</p>
          <p>What do you think about this service? Is it useful ?</p>
        </div>
        <div className="faces-wrapper">
          <button
            type="button"
            className={`face${rating === "bad" ? " selected" : ""}`}
            onClick={() => setRating("bad")}
          >
            <img src={angry} alt="angry face" />
            <p>Bad</p>
          </button>
          <button
            type="button"
            className={`face${rating === "ok" ? " selected" : ""}`}
            onClick={() => setRating("ok")}
          >
            <img src={ok} alt="ok face" />
            <p>Okay</p>
          </button>
          <button
            type="button"
            className={`face${rating === "happy" ? " selected" : ""}`}
            onClick={() => setRating("happy")}
          >
            <img src={happy} alt="happy face" />
            <p>Good</p>
          </button>
        </div>
        <div className="textarea-wrapper">
          <label htmlFor="feedback">What are the main reasons for your rating?</label>
          <textarea
            name="feedback"
            id="feedback"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>
          <p>
            Thank you for your feedback. Clear comments help us improve the
            patient experience faster.
          </p>
        </div>
        {status.text && (
          <div className={`feedback-status ${status.type}`}>{status.text}</div>
        )}
        <div className="btn-wrapper">
          <button type="button" onClick={handleSubmit}>
            Submit
          </button>
          <button
            type="button"
            onClick={() => {
              setRating("");
              setMessage("");
              setStatus({ type: "", text: "" });
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

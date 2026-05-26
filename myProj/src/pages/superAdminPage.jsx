import { useEffect, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import "./superAdminPage.css";
import { getStoredUser } from "../utils/auth.js";
import { loadSuperAdminFeedback } from "../utils/appointments.js";

function formatDateTime(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RATING_CONFIG = {
  happy:     { emoji: "😊", color: "#16a34a", bg: "#dcfce7" },
  satisfied: { emoji: "🙂", color: "#2563eb", bg: "#dbeafe" },
  neutral:   { emoji: "😐", color: "#d97706", bg: "#fef3c7" },
  average:   { emoji: "😐", color: "#d97706", bg: "#fef3c7" },
  ok:        { emoji: "🙂", color: "#2563eb", bg: "#dbeafe" },
  sad:       { emoji: "😞", color: "#dc2626", bg: "#fee2e2" },
  angry:     { emoji: "😠", color: "#dc2626", bg: "#fee2e2" },
  bad:       { emoji: "👎", color: "#dc2626", bg: "#fee2e2" },
  good:      { emoji: "👍", color: "#16a34a", bg: "#dcfce7" },
  excellent: { emoji: "⭐", color: "#16a34a", bg: "#dcfce7" },
};

function RatingChip({ rating }) {
  const key = String(rating || "").toLowerCase();
  const cfg = RATING_CONFIG[key] || { emoji: "💬", color: "#64748b", bg: "#f1f5f9" };
  return (
    <span className="sa-rating-chip" style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.emoji} {rating}
    </span>
  );
}

function SentimentTag({ word, count, sentiment }) {
  const colors = {
    positive: { bg: "#dcfce7", color: "#16a34a" },
    negative: { bg: "#fee2e2", color: "#dc2626" },
    topic:    { bg: "#dbeafe", color: "#1d4ed8" },
  };
  const c = colors[sentiment] || { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span className="sa-tag" style={{ background: c.bg, color: c.color }}>
      {word} <em>×{count}</em>
    </span>
  );
}

export default function SuperAdminPage({ setUser }) {
  const user = getStoredUser();
  const [data, setData] = useState({
    feedback: [],
    weekly_summary: {
      total_feedback: 0,
      most_repeated_feedback: null,
      top_themes: [],
      rating_distribution: {},
      recommendation: "",
    },
  });
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all"); // "all" | "positive" | "negative"

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await loadSuperAdminFeedback();
        if (!active) return;
        setData(res);
      } catch (e) {
        if (!active) return;
        setError(e.message || "Unable to load feedback.");
      }
    }
    load();
    return () => { active = false; };
  }, []);

  if (user?.role !== "super_admin") {
    return (
      <>
        <Nav user={user} setUser={setUser} />
        <main className="portal-page">
          <div className="portal-shell" style={{ paddingTop: 60 }}>
            <div className="portal-empty-state">
              This page is reserved for super admin accounts.
            </div>
          </div>
        </main>
      </>
    );
  }

  const summary = data.weekly_summary || {};
  const topThemes = summary.top_themes || [];
  const ratingDist = summary.rating_distribution || {};
  const negativeThemes = topThemes.filter((t) => t.sentiment === "negative");
  const positiveThemes = topThemes.filter((t) => t.sentiment === "positive");

  // Filtered feedback by tab
  const POSITIVE_RATINGS = new Set(["happy", "good", "excellent", "satisfied"]);
  const NEGATIVE_RATINGS = new Set(["sad", "angry", "bad"]);
  const filteredFeedback = data.feedback.filter((item) => {
    const r = String(item.rating || "").toLowerCase();
    if (tab === "positive") return POSITIVE_RATINGS.has(r);
    if (tab === "negative") return NEGATIVE_RATINGS.has(r);
    return true;
  });

  // Top 5 most repeated (all time)
  const repeatedMap = new Map();
  data.feedback.forEach((item) => {
    const key = String(item.message || "").trim().toLowerCase();
    if (!key) return;
    const ex = repeatedMap.get(key) || { message: item.message, count: 0, rating: item.rating };
    repeatedMap.set(key, { ...ex, count: ex.count + 1 });
  });
  const topRepeated = Array.from(repeatedMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Sentiment bar widths
  const totalRatings = Object.values(ratingDist).reduce((s, v) => s + v, 0);

  return (
    <>
      <Nav user={user} setUser={setUser} />
      <main className="portal-page">

        {/* ── Header ── */}
        <section className="portal-header">
          <div className="portal-header-copy">
            <span className="portal-badge">Super Admin</span>
            <h1>Feedback Intelligence</h1>
            <p>Patient comments analysed for sentiment and turned into weekly priorities.</p>
          </div>
          <div className="portal-header-stats">
            <div className="portal-stat-card">
              <strong>{data.feedback.length}</strong>
              <span>Total feedback</span>
            </div>
            <div className="portal-stat-card">
              <strong>{summary.total_feedback || 0}</strong>
              <span>This week</span>
            </div>
            <div className="portal-stat-card">
              <strong style={{ color: negativeThemes[0] ? "#fca5a5" : "#86efac" }}>
                {negativeThemes[0]?.word || positiveThemes[0]?.word || "--"}
              </strong>
              <span>Top signal</span>
            </div>
          </div>
        </section>

        <div className="sa-page-shell">
          {error && <div className="portal-inline-message error">{error}</div>}

          <div className="sa-layout">

            {/* ══ LEFT / CENTER — feedback list ══ */}
            <div className="sa-main">

              {/* Tabs */}
              <div className="sa-tabs">
                {[
                  { key: "all",      label: `All  (${data.feedback.length})` },
                  { key: "positive", label: `Positive` },
                  { key: "negative", label: `Negative` },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`sa-tab${tab === t.key ? " active" : ""}`}
                    onClick={() => setTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="sa-feed">
                {filteredFeedback.length > 0 ? filteredFeedback.map((item) => (
                  <article className="sa-card" key={item.id}>
                    <div className="sa-card-top">
                      <div className="sa-avatar">
                        {(item.fullName || "?")[0].toUpperCase()}
                      </div>
                      <div className="sa-card-meta">
                        <strong>{item.fullName || "Unknown user"}</strong>
                        <span>{item.email || "—"}</span>
                      </div>
                      <div className="sa-card-right">
                        <RatingChip rating={item.rating} />
                        <time>{formatDateTime(item.created_at)}</time>
                      </div>
                    </div>
                    <p className="sa-card-message">{item.message}</p>
                  </article>
                )) : (
                  <div className="portal-empty-state">No feedback in this category yet.</div>
                )}
              </div>
            </div>

            {/* ══ RIGHT — insights ══ */}
            <aside className="sa-sidebar">

              {/* Recommendation */}
              <div className="sa-insight-card sa-recommendation">
                <div className="sa-insight-label">
                  <span className="sa-dot sa-dot-blue" />
                  Smart recommendation
                </div>
                <p>{summary.recommendation || "Not enough feedback yet to generate a recommendation."}</p>
              </div>

              {/* Top signals */}
              {topThemes.length > 0 && (
                <div className="sa-insight-card">
                  <div className="sa-insight-label">
                    <span className="sa-dot sa-dot-purple" />
                    Top signals this week
                  </div>
                  <div className="sa-tags">
                    {topThemes.map((t) => (
                      <SentimentTag key={t.word} {...t} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rating breakdown */}
              {totalRatings > 0 && (
                <div className="sa-insight-card">
                  <div className="sa-insight-label">
                    <span className="sa-dot sa-dot-green" />
                    Rating breakdown
                  </div>
                  <div className="sa-bars">
                    {Object.entries(ratingDist).map(([rating, count]) => {
                      const pct = Math.round((count / totalRatings) * 100);
                      const key = rating.toLowerCase();
                      const cfg = RATING_CONFIG[key] || { color: "#64748b", bg: "#f1f5f9" };
                      return (
                        <div key={rating} className="sa-bar-row">
                          <span className="sa-bar-label" style={{ textTransform: "capitalize" }}>
                            {RATING_CONFIG[key]?.emoji || "💬"} {rating}
                          </span>
                          <div className="sa-bar-track">
                            <div
                              className="sa-bar-fill"
                              style={{ width: `${pct}%`, background: cfg.color }}
                            />
                          </div>
                          <span className="sa-bar-count">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Most repeated */}
              <div className="sa-insight-card">
                <div className="sa-insight-label">
                  <span className="sa-dot sa-dot-orange" />
                  Most repeated
                </div>
                {topRepeated.length > 0 ? (
                  <div className="sa-repeated-list">
                    {topRepeated.map((item, idx) => (
                      <div key={idx} className="sa-repeated-row">
                        <span className="sa-repeated-rank">#{idx + 1}</span>
                        <div className="sa-repeated-body">
                          <p>{item.message}</p>
                          <div className="sa-repeated-foot">
                            <RatingChip rating={item.rating} />
                            <span className="sa-repeated-count">{item.count}× repeated</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sa-empty-small">No repeated messages yet.</p>
                )}
              </div>

            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

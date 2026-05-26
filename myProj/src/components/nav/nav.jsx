import "./nav.css";
import logo from "../../assets/logo.png";
import logoScrolled from "../../assets/logo1.png";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell, faCalendarCheck, faCircleUser, faClockRotateLeft,
  faBoxArchive, faArrowRightFromBracket, faBars, faGear,
  faHouse, faTriangleExclamation, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { clearStoredUser } from "../../utils/auth.js";
import { getUnreadNotificationCount } from "../../utils/appointments.js";
import { useLanguage } from "../../context/LanguageContext.jsx";
import { t } from "../../context/translations.js";


export default function Nav({ user, setUser }) {
  const [scrolled, setScrolled] = useState(false);
  const [showSideBar, setShowSideBar] = useState(false);
  const { language } = useLanguage();
  const [notificationCount, setNotificationCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const syncNotificationCount = () =>
      setNotificationCount(getUnreadNotificationCount(user?.id));

    syncNotificationCount();
    window.addEventListener("urgentflow-notifications-changed", syncNotificationCount);
    window.addEventListener("storage", syncNotificationCount);

    return () => {
      window.removeEventListener(
        "urgentflow-notifications-changed",
        syncNotificationCount,
      );
      window.removeEventListener("storage", syncNotificationCount);
    };
  }, [user?.id]);

  const handleLogout = () => {
    clearStoredUser();
    if (setUser) {
      setUser(null);
    }
    navigate("/");
  };

  const closeSidebar = () => setShowSideBar(false);

  const sidebarLinks =
    user?.role === "super_admin"
      ? [{ to: "/super-admin", label: t(language, "superAdmin"), icon: faCircleUser }]
      : user?.role === "admin"
        ? [
            { to: "/admin", label: t(language, "admin"), icon: faCircleUser, end: true },
            { to: "/admin/archives", label: t(language, "archives"), icon: faBoxArchive },
          ]
      : [
          { to: "/profile", label: t(language, "profile"), icon: faCircleUser },
          { to: "/appointments", label: t(language, "appointments"), icon: faCalendarCheck },
          { to: "/history", label: t(language, "history"), icon: faClockRotateLeft },
          { to: "/settings", label: t(language, "settings"), icon: faGear },
          { to: "/notifications", label: t(language, "notifications"), icon: faBell, count: notificationCount },
        ];

  return (
    <div className="main">
      <div
        className={`sidebar-overlay ${showSideBar ? "active" : ""}`}
        onClick={closeSidebar}
      ></div>

      <aside className={`sidebar-container ${showSideBar ? "open" : ""}`}>
        <div className="sidebar-top">
          <img src={logo} alt="UrgentFlow" className="sidebar-logo" />
          <button
            type="button"
            className="sidebar-close"
            onClick={closeSidebar}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="sidebar-headline">
          {user ? (
            <div className="sidebar-user-card">
              <div className="sidebar-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt="avatar" className="sidebar-avatar-img" />
                ) : (
                  <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="sidebarGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#4e8eff" />
                        <stop offset="100%" stopColor="#2f76f6" />
                      </linearGradient>
                    </defs>
                    <circle cx="22" cy="22" r="22" fill="url(#sidebarGrad)" />
                    <text x="22" y="22" dominantBaseline="central" textAnchor="middle"
                      fill="white" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">
                      {String(user.fullName || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                    </text>
                  </svg>
                )}
              </div>
              <div className="sidebar-user-info">
                <strong>{user.fullName}</strong>
                <span>
                  {user.role === "super_admin" ? "Super Admin"
                    : user.role === "admin" ? `${user.serviceScope || "Admin"}`
                    : user.email}
                </span>
              </div>
            </div>
          ) : (
            <div className="sidebar-guest">
              <span>👋 Welcome</span>
              <p>Sign in to access your appointments and notifications.</p>
            </div>
          )}
        </div>

        <nav className="sidebar-menu">
          {user ? (
            <>
              <p className="menu-label">
                {user?.role === "super_admin"
                  ? t(language, "superAdmin")
                  : user?.role === "admin"
                    ? `${user.serviceScope || "Service"} — ${t(language, "admin")}`
                    : t(language, "mySpace")}
              </p>
              {sidebarLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end || false}
                  className={({ isActive }) =>
                    `sidebar-item${isActive ? " active" : ""}`
                  }
                  onClick={closeSidebar}
                >
                  <FontAwesomeIcon icon={item.icon} className="side-icon" />
                  <span>{item.label}</span>
                  {typeof item.count === "number" && item.count > 0 && (
                    <span className="notif-count">{item.count}</span>
                  )}
                </NavLink>
              ))}

              <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faArrowRightFromBracket} />
                  <span>{t(language, "logout")}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="menu-label">{t(language, "login")}</p>
              <NavLink to="/login" className="sidebar-item" onClick={closeSidebar}>
                <FontAwesomeIcon icon={faCircleUser} className="side-icon" />
                <span>{t(language, "login")}</span>
              </NavLink>
              <NavLink to="/signup" className="sidebar-item" onClick={closeSidebar}>
                <FontAwesomeIcon icon={faCalendarCheck} className="side-icon" />
                <span>{t(language, "signup")}</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>

      <nav className={`nav-wrapper ${scrolled ? "shrink" : ""}`}>
        <Link to="/" className="nav-brand">
          <img
            className="nav-pic"
            src={scrolled ? logoScrolled : logo}
            alt="UrgentFlow logo"
          />
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-element${isActive ? " active" : ""}`}>
            <FontAwesomeIcon icon={faHouse} className="nav-icon" />
            {t(language, "home")}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-element${isActive ? " active" : ""}`}>
            {t(language, "about")}
          </NavLink>
          <NavLink to="/hospitals" className={({ isActive }) => `nav-element${isActive ? " active" : ""}`}>
            {t(language, "hospitals")}
          </NavLink>
          <NavLink to="/emergency" className={({ isActive }) => `nav-element emergency-link${isActive ? " active" : ""}`}>
            <FontAwesomeIcon icon={faTriangleExclamation} className="nav-icon" />
            {t(language, "emergency")}
          </NavLink>
        </div>

        {user ? (
          <button type="button" className="user-icon-wrapper" onClick={() => setShowSideBar(true)}>
            <div className="nav-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" className="nav-avatar-img" />
              ) : (
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="navAvatarGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4e8eff" />
                      <stop offset="100%" stopColor="#2f76f6" />
                    </linearGradient>
                  </defs>
                  <circle cx="18" cy="18" r="18" fill="url(#navAvatarGrad)" />
                  <text x="18" y="18" dominantBaseline="central" textAnchor="middle"
                    fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif">
                    {String(user.fullName || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                  </text>
                </svg>
              )}
            </div>
            <div className="user-name-block">
              {user.role === "admin" && user.serviceScope ? (
                <>
                  <span className="user-name">{user.serviceScope}</span>
                  <span className="user-role-tag">Admin</span>
                </>
              ) : user.role === "super_admin" ? (
                <>
                  <span className="user-name">Super Admin</span>
                </>
              ) : (
                <span className="user-name">{user.fullName}</span>
              )}
            </div>
            {notificationCount > 0 && (
              <span className="user-badge">{notificationCount}</span>
            )}
          </button>
        ) : (
          <div className="btn-wrapper1">
            <Link to="/login" className="log-in">{t(language, "login")}</Link>
            <Link to="/signup" className="create-account">{t(language, "signup")}</Link>
          </div>
        )}

        <button
          type="button"
          className="hamburger"
          onClick={() => setShowSideBar(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </nav>
    </div>
  );
}

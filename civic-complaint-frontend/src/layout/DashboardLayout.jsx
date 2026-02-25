import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import "../styles/dashboard.css";

function MenuIcon({ label }) {
  return <span className="menu-icon">{label.slice(0, 1)}</span>;
}

export default function DashboardLayout({ title, subtitle, children, menuItems = [], activeMenu = "", onMenuChange }) {
  const role = localStorage.getItem("role") || "citizen";
  const name = localStorage.getItem("name") || "Citizen User";

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications/my", { params: { unread_only: true } });
        setNotifications(res.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications([]);
    } catch (error) {
      console.error(error);
    }
  };

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <div className="brand-wrap">
          <div className="brand-logo">C</div>
          <div>
            <h2>Civic</h2>
            <p>{role.charAt(0).toUpperCase() + role.slice(1)} workspace</p>
          </div>
        </div>

        <nav className="side-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`side-nav-item ${activeMenu === item.key ? "active" : ""}`}
              onClick={() => onMenuChange?.(item.key)}
            >
              <MenuIcon label={item.label} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="rail-footer">
          <div className="profile-mini">
            <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
            <div>
              <p>{name}</p>
              <small>{role}</small>
            </div>
          </div>
          <button type="button" className="logout-btn rail-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-stage">
        <header className="top-bar">
          <div className="search-wrap">
            <input type="text" placeholder="Search complaints..." />
          </div>
          <div className="top-actions">
            <button type="button" className="icon-btn notify-btn" onClick={() => setShowNotifications((v) => !v)}>
              N
              {unreadCount > 0 && <span className="notify-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notify-panel">
                <div className="notify-head">
                  <strong>Notifications</strong>
                  <button type="button" onClick={markAllRead}>Mark all read</button>
                </div>
                {notifications.length === 0 ? (
                  <p className="notify-empty">No new notifications.</p>
                ) : (
                  <ul>
                    {notifications.slice(0, 8).map((item) => (
                      <li key={item.id}>
                        <p><b>{item.title}</b></p>
                        <p>{item.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="profile-pill">
              <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
              <span>{name}</span>
            </div>
          </div>
        </header>

        <section className="content-stage">
          <div className="page-heading">
            <h1>{title}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {children}
        </section>
      </main>
    </div>
  );
}

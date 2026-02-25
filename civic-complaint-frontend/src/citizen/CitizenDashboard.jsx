import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import CreateComplaint from "../complaints/CreateComplaint";
import MyComplaints from "../complaints/MyComplaints";
import ComplaintTracker from "../complaints/ComplaintTracker";
import DashboardLayout from "../layout/DashboardLayout";
import CitizenSettings from "./CitizenSettings";
import "../styles/dashboard.css";
import "../styles/complaints.css";

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "create", label: "File Complaint" },
  { key: "my", label: "My Complaints" },
  { key: "track", label: "Track Complaint" },
  { key: "settings", label: "Settings" },
];

export default function CitizenDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await api.get("/complaints/my");
        setComplaints(res.data || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchComplaints();
  }, []);

  const stats = useMemo(() => {
    const pending = complaints.filter((c) => (c.status || "Pending") === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const rejected = complaints.filter((c) => c.status === "Rejected").length;
    return { pending, inProgress, resolved, rejected };
  }, [complaints]);

  return (
    <DashboardLayout
      title={`Good day, ${localStorage.getItem("name") || "Citizen"}`}
      subtitle="Track and manage all complaints from one place."
      menuItems={MENU_ITEMS}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      {activeMenu === "dashboard" && (
        <section className="dashboard-overview">
          <div className="summary-grid">
            <div className="summary-card summary-card-blue"><span>Pending</span><strong>{stats.pending}</strong></div>
            <div className="summary-card summary-card-orange"><span>In Progress</span><strong>{stats.inProgress}</strong></div>
            <div className="summary-card summary-card-green"><span>Resolved</span><strong>{stats.resolved}</strong></div>
            <div className="summary-card summary-card-pink"><span>Rejected</span><strong>{stats.rejected}</strong></div>
          </div>

          <div className="dashboard-list-shell">
            <div className="quick-filter-row">
              <span className="filter-chip active">All</span>
              <span className="filter-chip">Pending {stats.pending}</span>
              <span className="filter-chip">In Progress {stats.inProgress}</span>
              <span className="filter-chip">Resolved {stats.resolved}</span>
            </div>

            <h3>All Complaints</h3>
            <div className="complaint-list">
              {complaints.length === 0 && <p>No complaints yet.</p>}
              {complaints.slice(0, 6).map((c) => (
                <article className="complaint-list-item" key={c.id}>
                  <div className="complaint-list-main">
                    <h4>{c.title}</h4>
                    <p>{c.description}</p>
                    <small>{c.location || "Location not provided"}</small>
                  </div>
                  <div className="complaint-list-side">
                    <span className={`status ${c.status?.toLowerCase() || "pending"}`}>{c.status || "Pending"}</span>
                    <span className="list-id">{c.tracking_id || `ID-${c.id}`}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeMenu === "create" && <CreateComplaint />}
      {activeMenu === "my" && <MyComplaints />}
      {activeMenu === "track" && <ComplaintTracker />}
      {activeMenu === "settings" && <CitizenSettings />}
    </DashboardLayout>
  );
}

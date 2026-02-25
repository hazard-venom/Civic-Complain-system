import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import "../styles/complaints.css";

const MENU_ITEMS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "assigned", label: "Assigned" },
  { key: "updates", label: "Status Updates" },
  { key: "accounts", label: "Accounts" },
];

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${api.defaults.baseURL}/media/${imagePath}`;
};

export default function OfficerDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [complaints, setComplaints] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    const onEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedImage("");
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (activeMenu === "accounts") {
      fetchAccounts();
    }
  }, [activeMenu]);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/officer/my-complaints");
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/officer/complaint/${id}`, null, {
        params: {
          status,
          remark: remarks[id] || "",
        },
      });

      alert("Status updated");
      fetchComplaints();
    } catch (err) {
      alert("Failed to update");
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await api.get("/officer/accounts");
      setAccounts(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const promoteToOfficer = async (userId) => {
    try {
      const res = await api.put(`/officer/promote/${userId}`);
      alert(res.data?.message || "Role updated");
      fetchAccounts();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to update role");
    }
  };

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => (c.status || "Pending") === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  }, [complaints]);

  const visibleComplaints = useMemo(() => {
    if (activeMenu === "assigned") {
      return complaints.filter((c) => c.status !== "Resolved");
    }
    if (activeMenu === "updates") {
      return complaints.filter((c) => c.status === "In Progress" || c.status === "Resolved");
    }
    return complaints;
  }, [activeMenu, complaints]);

  return (
    <DashboardLayout
      title="Officer Dashboard"
      subtitle="Investigate and close assigned complaints."
      menuItems={MENU_ITEMS}
      activeMenu={activeMenu}
      onMenuChange={setActiveMenu}
    >
      <section className="panel-section">
        <div className="action-row">
          <span className="meta-chip">Accounts Manager</span>
          <button className="primary-btn" onClick={() => setActiveMenu("accounts")}>
            Open Accounts
          </button>
        </div>
      </section>

      <div className="tabs-row">
        <button
          className={`tab-btn ${activeMenu === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveMenu("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`tab-btn ${activeMenu === "assigned" ? "active" : ""}`}
          onClick={() => setActiveMenu("assigned")}
        >
          Assigned
        </button>
        <button
          className={`tab-btn ${activeMenu === "updates" ? "active" : ""}`}
          onClick={() => setActiveMenu("updates")}
        >
          Status Updates
        </button>
        <button
          className={`tab-btn ${activeMenu === "accounts" ? "active" : ""}`}
          onClick={() => setActiveMenu("accounts")}
        >
          Accounts
        </button>
      </div>

      {activeMenu !== "accounts" && (
        <>
          <div className="summary-grid">
            <div className="summary-card summary-card-blue"><span>Total Assigned</span><strong>{stats.total}</strong></div>
            <div className="summary-card summary-card-orange"><span>Pending</span><strong>{stats.pending}</strong></div>
            <div className="summary-card summary-card-green"><span>In Progress</span><strong>{stats.inProgress}</strong></div>
            <div className="summary-card summary-card-pink"><span>Resolved</span><strong>{stats.resolved}</strong></div>
          </div>

          {visibleComplaints.length === 0 && <p>No complaints available.</p>}

          <div className="complaints-grid">
            {visibleComplaints.map((c) => (
              <div key={c.id} className="complaint-card officer-card">
                <div className="complaint-header">
                  <h4>{c.title}</h4>
                  <span className={`status ${c.status?.toLowerCase() || "pending"}`}>
                    {c.status || "Pending"}
                  </span>
                </div>

                <div className="meta-row">
                  <span className="meta-chip">Category: {c.category}</span>
                  <span className="meta-chip">Priority: {c.priority || "Low"}</span>
                </div>

                <p className="location">Location: {c.location || "Location not provided"}</p>
                <p className="description">{c.description}</p>

                {c.image ? (
                  <button
                    type="button"
                    className="image-btn"
                    onClick={() => setSelectedImage(getImageUrl(c.image))}
                  >
                    <img
                      className="complaint-image"
                      src={getImageUrl(c.image)}
                      alt="Complaint"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                      }}
                    />
                  </button>
                ) : (
                  <img
                    className="complaint-image"
                    src="https://via.placeholder.com/300x200?text=No+Image"
                    alt="No Image"
                  />
                )}

                <div className="officer-actions">
                  {c.status !== "Resolved" ? (
                    <>
                      <textarea
                        placeholder="Add remark"
                        value={remarks[c.id] || ""}
                        onChange={(e) => setRemarks((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      />

                      <div className="action-row">
                        <button className="secondary-btn" onClick={() => updateStatus(c.id, "In Progress")}>
                          Mark In Progress
                        </button>

                        <button className="primary-btn" onClick={() => updateStatus(c.id, "Resolved")}>
                          Mark Resolved
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="resolved-note">This complaint is already resolved.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeMenu === "accounts" && (
        <section className="panel-section">
          <h3>All Created Accounts</h3>
          {loadingAccounts && <p>Loading accounts...</p>}
          {!loadingAccounts && accounts.length === 0 && <p>No users found.</p>}
          <div className="complaint-list">
            {accounts.map((user) => (
              <article className="complaint-list-item" key={user.id}>
                <div className="complaint-list-main">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                  <small>{user.phone || "No phone"}</small>
                </div>
                <div className="complaint-list-side">
                  <span className="meta-chip">Role: {user.role}</span>
                  {user.role === "citizen" ? (
                    <button className="primary-btn" onClick={() => promoteToOfficer(user.id)}>
                      Make Officer
                    </button>
                  ) : (
                    <span className="resolved-note">No action</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedImage && (
        <div className="image-modal-overlay" onClick={() => setSelectedImage("")}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="image-modal-close"
              onClick={() => setSelectedImage("")}
            >
              Close
            </button>
            <img className="image-modal-img" src={selectedImage} alt="Complaint full size" />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

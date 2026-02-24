import { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import AssignOfficer from "./AssignOfficer";
import "../styles/complaints.css";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${api.defaults.baseURL}/media/${imagePath}`;
};

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [refresh, setRefresh] = useState(false);
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
    api.get("/complaints")
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error(err));
  }, [refresh]);

  const stats = useMemo(() => {
    const total = complaints.length;
    const pending = complaints.filter((c) => (c.status || "Pending") === "Pending").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    return { total, pending, inProgress, resolved };
  }, [complaints]);

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="summary-grid">
        <div className="summary-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="summary-card"><span>Pending</span><strong>{stats.pending}</strong></div>
        <div className="summary-card"><span>In Progress</span><strong>{stats.inProgress}</strong></div>
        <div className="summary-card"><span>Resolved</span><strong>{stats.resolved}</strong></div>
      </div>

      {complaints.length === 0 && <p>No complaints available.</p>}

      <div className="complaints-grid">
        {complaints.map((c) => (
          <div className="complaint-card admin-card" key={c.id}>
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

            {c.status !== "Resolved" && (
              <div className="assign-wrap">
                <AssignOfficer
                  complaintId={c.id}
                  onAssigned={() => setRefresh(!refresh)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

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

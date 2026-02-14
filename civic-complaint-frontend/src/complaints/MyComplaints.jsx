import { useEffect, useState } from "react";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import "../styles/complaints.css";

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/complaints/my");
      setComplaints(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load complaints.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="My Complaints">
      {loading && <p>Loading complaints...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && complaints.length === 0 && (
        <p>No complaints filed yet.</p>
      )}

      <div className="complaints-grid">
        {complaints.map((c) => (
          <div className="complaint-card" key={c.id}>
            <div className="complaint-header">
              <h4>{c.title}</h4>
              <span className={`status ${c.status?.toLowerCase() || "pending"}`}>
                {c.status || "Pending"}
              </span>
            </div>

            <p className="location">📍 {c.location}</p>
            <p className="description">{c.description}</p>

            {c.image ? (
              <img
                className="complaint-image"
                src={`http://127.0.0.1:8000/media/${c.image}`}
                alt="Complaint"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x200?text=Image+Not+Available";
                }}
              />
            ) : (
              <img
                className="complaint-image"
                src="https://via.placeholder.com/300x200?text=No+Image"
                alt="No Image"
              />
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

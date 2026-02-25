import { useEffect, useState } from "react";
import api from "../api/api";
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
    <section className="panel-section">
      {loading && <p>Loading complaints...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && complaints.length === 0 && <p>No complaints filed yet.</p>}

      <div className="complaint-list">
        {complaints.map((c) => (
          <article className="complaint-list-item" key={c.id}>
            <div className="complaint-list-main">
              <h4>{c.title}</h4>
              <p>{c.description}</p>
              <small>{c.location || "Location not provided"}</small>
              <p>
                <b>Complaint No:</b> {c.tracking_id || `ID-${c.id}`}
              </p>
            </div>

            <div className="complaint-list-side">
              <span className={`status ${c.status?.toLowerCase() || "pending"}`}>
                {c.status || "Pending"}
              </span>
              <span className="meta-chip">{c.category}</span>
              <span className="meta-chip">{c.priority || "Low"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

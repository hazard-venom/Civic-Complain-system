import { useEffect, useState } from "react";
import api from "../api/api";
import "../styles/complaints.css";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export default function ComplaintTracker() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackData, setTrackData] = useState(null);
  const [myComplaints, setMyComplaints] = useState([]);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        const res = await api.get("/complaints/my");
        setMyComplaints(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMyComplaints();
  }, []);

  const trackComplaint = async (identifier) => {
    if (!identifier) {
      setError("Enter complaint ID or complaint number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/complaints/track/${encodeURIComponent(identifier)}`);
      setTrackData(res.data);
    } catch (err) {
      console.error(err);
      setTrackData(null);
      setError(err?.response?.data?.detail || "Unable to track complaint.");
    } finally {
      setLoading(false);
    }
  };

  const complaint = trackData?.complaint;
  const timeline = trackData?.timeline || [];

  return (
    <section className="panel-section tracker-section">
      <div className="tracker-search-row">
        <input
          type="text"
          value={query}
          placeholder="Enter complaint number (e.g. CMP-XXXX) or ID"
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="primary-btn" onClick={() => trackComplaint(query.trim())}>
          Track
        </button>
      </div>

      {myComplaints.length > 0 && (
        <div className="tracker-my-list">
          <p>Select from your recent complaints:</p>
          <div className="tracker-chip-wrap">
            {myComplaints.slice(0, 8).map((item) => (
              <button
                type="button"
                key={item.id}
                className="tracker-chip"
                onClick={() => {
                  const identifier = item.tracking_id || String(item.id);
                  setQuery(identifier);
                  trackComplaint(identifier);
                }}
              >
                {item.tracking_id || `ID-${item.id}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p>Tracking complaint...</p>}
      {error && <p className="error">{error}</p>}

      {complaint && (
        <div className="tracker-grid">
          <div className="complaint-card tracker-details">
            <h3>Complaint Details</h3>
            <p>
              <b>Complaint No:</b> {complaint.tracking_id || `ID-${complaint.id}`}
            </p>
            <p>
              <b>Status:</b>{" "}
              <span className={`status ${complaint.status?.toLowerCase() || "pending"}`}>
                {complaint.status || "Pending"}
              </span>
            </p>
            <p>
              <b>Title:</b> {complaint.title}
            </p>
            <p>
              <b>Category:</b> {complaint.category}
            </p>
            <p>
              <b>Priority:</b> {complaint.priority}
            </p>
            <p>
              <b>Location:</b> {complaint.location || "Location not provided"}
            </p>
            <p>
              <b>Description:</b> {complaint.description}
            </p>
            {complaint.image && (
              <img
                className="complaint-image"
                src={`http://127.0.0.1:8000/media/${complaint.image}`}
                alt="Complaint"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>

          <div className="complaint-card tracker-timeline">
            <h3>Complaint Timeline</h3>
            {timeline.length === 0 && <p>No timeline events yet.</p>}
            <ul className="timeline-list">
              {timeline.map((item) => (
                <li key={item.id} className="timeline-item">
                  <div className="timeline-dot" />
                  <div>
                    <p className="timeline-head">
                      <span>{item.status}</span>
                      <small>{formatDate(item.created_at)}</small>
                    </p>
                    <p className="timeline-remark">{item.remark || "No remarks"}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

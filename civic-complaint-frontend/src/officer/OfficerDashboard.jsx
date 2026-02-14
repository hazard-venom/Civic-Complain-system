import { useEffect, useState } from "react";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import "../styles/complaints.css";

export default function OfficerDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [remark, setRemark] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get("/officer/my-complaints")

      setComplaints(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/officer/complaint/${id}`, null, {
        params: {
          status: status,
          remark: remark,
        },
      });

      alert("Status Updated");
      fetchComplaints();
    } catch (err) {
      alert("Failed to update");
    }
  };

  return (
    <DashboardLayout title="Officer Dashboard">
      {complaints.length === 0 && <p>No complaints available.</p>}

      {complaints.map((c) => (
        <div key={c.id} className="complaint-card">
          <div className="complaint-header">
            <h4>{c.title}</h4>
            <span className={`status ${c.status?.toLowerCase()}`}>
              {c.status}
            </span>
          </div>

          <p>📍 {c.location}</p>
          <p>{c.description}</p>

          {c.image && (
            <img
              src={`http://127.0.0.1:8000/media/${c.image}`}
              width="200"
              alt="Complaint"
            />
          )}

          <div className="officer-actions">
            <textarea
              placeholder="Add remark"
              onChange={(e) => setRemark(e.target.value)}
            />

            <button onClick={() => updateStatus(c.id, "In Progress")}>
              Mark In Progress
            </button>

            <button onClick={() => updateStatus(c.id, "Resolved")}>
              Mark Resolved
            </button>
          </div>
        </div>
      ))}
    </DashboardLayout>
  );
}

import { useEffect, useState } from "react";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import AssignOfficer from "./AssignOfficer";

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    api.get("/complaints")
      .then(res => setComplaints(res.data))
      .catch(err => console.error(err));
  }, [refresh]);

  return (
    <DashboardLayout title="Admin Dashboard">
      {complaints.map(c => (
        <div className="card" key={c.id}>
          <h4>{c.title}</h4>
          <p><b>Status:</b> {c.status}</p>
          <p><b>Location:</b> {c.location}</p>

        {c.status !== "Resolved" && (
          <AssignOfficer
            complaintId={c.id}
            onAssigned={() => setRefresh(!refresh)}
          />
        )}
 
        </div>
      ))}
    </DashboardLayout>
  );
}

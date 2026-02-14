import { useState } from "react";
import CreateComplaint from "../complaints/CreateComplaint";
import MyComplaints from "../complaints/MyComplaints";

export default function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState("create");

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div>
      <div style={{ padding: "20px", background: "#2c7be5", color: "white" }}>
        <h2>Civic Complaint System</h2>
        <button
          onClick={logout}
          style={{
            float: "right",
            padding: "6px 12px",
            background: "white",
            border: "none",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        <button onClick={() => setActiveTab("create")}>
          File Complaint
        </button>

        <button
          onClick={() => setActiveTab("my")}
          style={{ marginLeft: "10px" }}
        >
          My Complaints
        </button>

        <hr style={{ margin: "20px 0" }} />

        {activeTab === "create" && <CreateComplaint />}
        {activeTab === "my" && <MyComplaints />}
      </div>
    </div>
  );
}

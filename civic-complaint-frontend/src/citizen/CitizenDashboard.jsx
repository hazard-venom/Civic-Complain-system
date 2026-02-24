import { useState } from "react";
import CreateComplaint from "../complaints/CreateComplaint";
import MyComplaints from "../complaints/MyComplaints";
import DashboardLayout from "../layout/DashboardLayout";
import "../styles/dashboard.css";

export default function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <DashboardLayout title="Citizen Dashboard">
      <div className="tabs-row">
        <button
          className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
        >
          File Complaint
        </button>
        <button
          className={`tab-btn ${activeTab === "my" ? "active" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          My Complaints
        </button>
      </div>

      {activeTab === "create" && <CreateComplaint />}
      {activeTab === "my" && <MyComplaints />}
    </DashboardLayout>
  );
}

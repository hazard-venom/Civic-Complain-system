import Login from "./auth/Login";
import CitizenDashboard from "./citizen/CitizenDashboard";
import AdminDashboard from "./admin/AdminDashboard";
import OfficerDashboard from "./officer/OfficerDashboard";

export default function App() {
  const role = localStorage.getItem("role");

  if (!role) return <Login />;

  if (role === "admin") return <AdminDashboard />;
  if (role === "officer") return <OfficerDashboard />;

  return <CitizenDashboard />;
}

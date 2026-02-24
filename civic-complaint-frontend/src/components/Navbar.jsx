export default function Navbar() {
  const role = localStorage.getItem("role");
  const roleLabel =
    role === "citizen" ? "Citizen" : role === "admin" ? "Admin" : "Officer";

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h3>Civic Complaint System</h3>
        <span className="role-pill">{roleLabel}</span>
      </div>

      <div className="navbar-links">
        {role === "citizen" && <span>Citizen Dashboard</span>}
        {role === "admin" && <span>Admin Dashboard</span>}
        {role === "officer" && <span>Officer Dashboard</span>}

        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

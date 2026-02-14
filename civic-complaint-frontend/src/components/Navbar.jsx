export default function Navbar() {
  const role = localStorage.getItem("role");

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <nav style={styles.nav}>
      <h3>Civic Complaint System</h3>

      <div style={styles.links}>
        {role === "citizen" && <span>My Complaints</span>}
        {role === "admin" && <span>Admin Dashboard</span>}
        {role === "officer" && <span>Officer Dashboard</span>}

        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "#1976d2",
    color: "white",
  },
  links: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },
};

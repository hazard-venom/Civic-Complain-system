import Navbar from "../components/Navbar";
import "../styles/dashboard.css";

export default function DashboardLayout({ title, children }) {
  return (
    <>
      <Navbar />

      <div className="dashboard">
        <main className="content">
          <div className="page-heading">
            <h2>{title}</h2>
            <p>Report, manage, and resolve civic issues faster.</p>
          </div>
          {children}
        </main>
      </div>
    </>
  );
}

import { useState } from "react";
import api from "../api/api";
import Register from "./Register";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const res = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name || "User");
      localStorage.setItem("phone", res.data.phone || "");
      window.location.reload();
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return <Register switchToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-logo"><span className="auth-logo-badge">C</span> Civic</div>
          <h1>Civic Complaint Management System</h1>
          <p>Join the platform to report and track local issues efficiently.</p>
          <ul>
            <li>Easy complaint submission</li>
            <li>Transparent status tracking</li>
            <li>Real-time notifications</li>
          </ul>
        </section>

        <div className="auth-form-wrap">
          <form className="auth-card auth-form" onSubmit={handleLogin}>
            <h2 className="auth-title">Welcome back</h2>
            <p className="auth-subtitle">Sign in to continue.</p>

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>

            <p className="auth-switch">
              Don&apos;t have an account? <span className="auth-link" onClick={() => setShowRegister(true)}>Register</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import api from "../api/api";

export default function Register({ switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/register", form);
      setSuccess("Registration successful. Please login.");
      setTimeout(() => switchToLogin(), 700);
    } catch (err) {
      setError("Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <section className="auth-hero">
          <h1>Create your account</h1>
          <p>Join the platform to submit and track civic complaints.</p>
          <ul>
            <li>Fast complaint submission</li>
            <li>Transparent status updates</li>
            <li>Role-based access for each user type</li>
          </ul>
        </section>

        <form className="auth-card auth-form" onSubmit={handleRegister}>
          <h2 className="auth-title">Register</h2>
          <p className="auth-subtitle">Create your account in a minute.</p>

          <input
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />

          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <span className="auth-link" onClick={switchToLogin}>
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

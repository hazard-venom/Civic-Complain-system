import { useState } from "react";
import api from "../api/api";

export default function Register({ switchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  const isValidName = (name) => /^[A-Za-z][A-Za-z\s'-]*$/.test(name.trim());

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!isValidName(form.name) || form.name.trim().length < 2) {
      setNameError("Name can contain only letters and must be at least 2 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setNameError("");

    try {
      await api.post("/auth/register", form);
      setSuccess("Registration successful. Please login.");
      setTimeout(() => switchToLogin(), 700);
    } catch (err) {
      setError(err?.response?.data?.detail || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

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
          <form className="auth-card auth-form" onSubmit={handleRegister}>
            <h2 className="auth-title">Create account</h2>
            <p className="auth-subtitle">Register to submit and track complaints.</p>

            <input
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value && !isValidName(e.target.value)) {
                  setNameError("Only letters, spaces, apostrophes, and hyphens are allowed.");
                } else {
                  setNameError("");
                }
              }}
              required
            />
            {nameError && <p className="auth-error">{nameError}</p>}

            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              name="phone"
              type="tel"
              placeholder="Mobile number (e.g. +919876543210)"
              value={form.phone}
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
              Already have an account? <span className="auth-link" onClick={switchToLogin}>Login</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

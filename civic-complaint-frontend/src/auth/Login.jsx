import { useState } from "react";
import api from "../api/api";
import Register from "./Register";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new URLSearchParams();
    formData.append("username", email);   // must be username
    formData.append("password", password);

    try {
      const res = await api.post("/auth/login", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);

      window.location.reload();
    } catch (err) {
      alert("Invalid email or password");
    }
  };

  // 👇 If user clicks Register
  if (showRegister) {
    return <Register switchToLogin={() => setShowRegister(false)} />;
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>

        <p>
          Don't have an account?{" "}
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => setShowRegister(true)}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}

import { useEffect, useState } from "react";
import api from "../api/api";

export default function CitizenSettings() {
  const [phone, setPhone] = useState("");
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/notifications/settings");
        setPhone(res.data.phone || "");
        setSmsNotifications(Boolean(res.data.sms_notifications));
        setEmailNotifications(Boolean(res.data.email_notifications));
      } catch (err) {
        console.error(err);
      }
    };

    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/notifications/settings", {
        phone,
        sms_notifications: smsNotifications,
        email_notifications: emailNotifications,
      });

      localStorage.setItem("phone", res.data.phone || "");
      setMessage("Settings updated successfully.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel-section">
      <h3>Notification Settings</h3>
      <div className="settings-grid">
        <label className="settings-field">
          <span>Mobile Number</span>
          <input
            type="tel"
            placeholder="+919876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={smsNotifications}
            onChange={(e) => setSmsNotifications(e.target.checked)}
          />
          <span>Enable SMS notifications</span>
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
          />
          <span>Enable email notifications</span>
        </label>

        <button type="button" className="primary-btn" onClick={saveSettings} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && <p className="auth-success">{message}</p>}
        {error && <p className="auth-error">{error}</p>}
      </div>
    </section>
  );
}

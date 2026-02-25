import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import api from "../api/api";
import "../styles/complaints.css";

const CATEGORIES = ["Road", "Sanitation", "Water", "Electricity"];
const DEFAULT_CENTER = [20.5937, 78.9629];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapClickHandler({ onPick }) {
  useMapEvents({
    click: (event) => {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapViewUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function CreateComplaint() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [successInfo, setSuccessInfo] = useState(null);

  const markerPosition = latitude !== null && longitude !== null ? [latitude, longitude] : null;
  const mapCenter = useMemo(() => markerPosition || DEFAULT_CENTER, [markerPosition]);

  const setCoordinates = (lat, lng) => {
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation is not supported in this browser.");
      return;
    }

    setIsLocating(true);
    setGpsStatus("Fetching your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setCoordinates(lat, lng);
        setGpsStatus("Location captured. You can drag or re-place marker on map.");
        setIsLocating(false);
      },
      () => {
        setGpsStatus("Location permission denied or unavailable.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setLocation("");
    setLatitude(null);
    setLongitude(null);
    setGpsStatus("");
    setImage(null);
    setPreview(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("location", location);

    if (latitude !== null) formData.append("latitude", String(latitude));
    if (longitude !== null) formData.append("longitude", String(longitude));

    if (image) {
      formData.append("image", image);
    }

    try {
      const res = await api.post("/complaints/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessInfo({
        complaintId: res.data.complaint_id,
        trackingId: res.data.tracking_id || `ID-${res.data.complaint_id}`,
        emailCopySent: Boolean(res.data.email_copy_sent),
        smsSent: Boolean(res.data.sms_sent),
        smsStatusMessage: res.data.sms_status_message || "",
      });
      resetForm();
    } catch (err) {
      console.error(err);
      alert("Failed to submit complaint");
    }
  };

  return (
    <section className="panel-section">
      {successInfo && (
        <div className="success-card">
          <h4>Complaint Submitted</h4>
          <p>
            <b>Complaint Number:</b> {successInfo.trackingId}
          </p>
          <p>
            <b>Reference ID:</b> {successInfo.complaintId}
          </p>
          <p>
            {successInfo.emailCopySent
              ? "A copy has been sent to your registered email."
              : "Email copy is not configured on server yet."}
          </p>
          <p>
            {successInfo.smsSent
              ? "Complaint ID notification was sent to your mobile number."
              : successInfo.smsStatusMessage || "SMS notification is disabled or SMS provider is not configured."}
          </p>
        </div>
      )}

      <form className="complaint-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Complaint title"
          value={title}
          required
          onChange={(e) => setTitle(e.target.value)}
        />

        <select value={category} required onChange={(e) => setCategory(e.target.value)}>
          <option value="">Select category</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Describe the issue in detail"
          value={description}
          required
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="text"
          placeholder="Location (optional if GPS is used)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="gps-row">
          <button
            type="button"
            className="secondary-btn"
            onClick={getCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? "Locating..." : "Use My Current Location"}
          </button>

          {markerPosition && (
            <span className="gps-coords">
              Lat: {latitude}, Lng: {longitude}
            </span>
          )}
        </div>

        {gpsStatus && <p className="gps-status">{gpsStatus}</p>}

        <div className="map-wrap">
          <MapContainer center={mapCenter} zoom={markerPosition ? 16 : 5} className="complaint-map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewUpdater center={mapCenter} zoom={markerPosition ? 16 : 5} />
            <MapClickHandler onPick={setCoordinates} />
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable
                icon={markerIcon}
                eventHandlers={{
                  dragend: (event) => {
                    const pos = event.target.getLatLng();
                    setCoordinates(pos.lat, pos.lng);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>

        <input
          key={fileInputKey}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (!selectedFile) {
              setImage(null);
              setPreview(null);
              return;
            }
            setImage(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
          }}
        />

        {preview && <img src={preview} alt="Preview" className="preview-image" />}

        <button type="submit">Submit Complaint</button>
      </form>
    </section>
  );
}

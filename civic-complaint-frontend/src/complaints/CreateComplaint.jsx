import { useState } from "react";
import api from "../api/api";
import DashboardLayout from "../layout/DashboardLayout";
import "../styles/complaints.css";


export default function CreateComplaint() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("category", category);
    formData.append("description", description);
    formData.append("location", location);

    if (image) {
      formData.append("image", image);
    }

    try {
      await api.post("/complaints/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Complaint submitted successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to submit complaint");
    }
  };

  return (
    <DashboardLayout title="File Complaint">
      <form className="complaint-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          required
          onChange={(e) => setTitle(e.target.value)}
        />

        <input
          type="text"
          placeholder="Category"
          required
          onChange={(e) => setCategory(e.target.value)}
        />

        <textarea
          placeholder="Description"
          required
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="text"
          placeholder="Location"
          required
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            setImage(e.target.files[0]);
            setPreview(URL.createObjectURL(e.target.files[0]));
          }}
        />

        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="preview-image"
          />
        )}

        <button type="submit">Submit Complaint</button>
      </form>
    </DashboardLayout>
  );
}
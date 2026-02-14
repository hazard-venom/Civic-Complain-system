import { useState, useEffect } from "react";
import api from "../api/api";

export default function AssignOfficer({ complaintId, onAssigned }) {
  const [officers, setOfficers] = useState([]);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    api.get("/admin/officers")
      .then(res => setOfficers(res.data))
      .catch(err => console.error(err));
  }, []);

  const assign = async () => {
    if (!selected) return alert("Select an officer");

    await api.put(`/admin/assign/${complaintId}`, {
      officer_id: selected
    });

    alert("Officer assigned");
    onAssigned();
  };

  return (
    <div>
      <select onChange={e => setSelected(e.target.value)}>
        <option value="">Assign Officer</option>
        {officers.map(o => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>

      <button onClick={assign}>Assign</button>
    </div>
  );
}

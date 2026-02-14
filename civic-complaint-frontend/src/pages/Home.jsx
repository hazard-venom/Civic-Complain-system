import DashboardLayout from "../layout/DashboardLayout";

export default function Home() {
  const role = localStorage.getItem("role");

  return (
    <DashboardLayout title="Welcome">
      <p>Welcome! You are logged in as <b>{role}</b>.</p>

      {role === "citizen" && <p>You can file and track complaints.</p>}
      {role === "admin" && <p>You can manage and assign complaints.</p>}
      {role === "officer" && <p>You can resolve assigned complaints.</p>}
    </DashboardLayout>
  );
}

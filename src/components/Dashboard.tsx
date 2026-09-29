export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div style={{ padding: "40px" }}>
      <h1>HealDox Dashboard</h1>
      <p>Welcome {user.username}</p>
    </div>
  );
}
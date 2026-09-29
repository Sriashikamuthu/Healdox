import { useState } from "react";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    try {

      const res = await fetch("http://localhost:5000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage("Password reset link sent to your email.");

    } catch {
      setError("Server error");
    }

  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-6 rounded shadow">

      <h2 className="text-xl font-bold mb-4">
        Reset Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          required
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Send Reset Link
        </button>

      </form>

      {message && (
        <p className="text-green-600 mt-3">{message}</p>
      )}

      {error && (
        <p className="text-red-500 mt-3">{error}</p>
      )}

    </div>
  );
}
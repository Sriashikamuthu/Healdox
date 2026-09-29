import { useState } from "react";

export default function ResetPassword() {

  const token = window.location.pathname.split("/").pop();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {

    if (!password || !confirmPassword) {
      setMessage("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch("http://localhost:5000/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setSuccess(false);
        setMessage(data.error || "Failed to reset password");
      } else {
        setSuccess(true);
        setMessage("Password reset successfully! You can now login.");
      }

    } catch (err) {

      setSuccess(false);
      setMessage("Something went wrong.");

    }

    setLoading(false);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8 border border-gray-200">

        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          Reset Password
        </h2>

        <input
          type="password"
          placeholder="Enter New Password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {message && (
          <div className={`mt-4 text-sm text-center ${success ? "text-green-600" : "text-red-500"}`}>
            {message}
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>

      </div>

    </div>
  );
}
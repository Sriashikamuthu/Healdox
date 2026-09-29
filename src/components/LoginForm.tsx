import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Props {
  switchMode: () => void;
  onClose: () => void;
}

export default function LoginForm({ switchMode, onClose }: Props) {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log("Login success");

    navigate("/dashboard");

    onClose();
    setLoading(false);
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>

      <form onSubmit={handleLogin} className="space-y-4">

        <div>
          <label className="text-sm">Email</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div>
          <label className="text-sm">Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={() => window.location.href = "/forgot-password"}
            className="text-sm text-blue-600 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

      </form>

      <p className="text-center mt-4 text-sm">
        Don't have an account?{" "}
        <button
          type="button"
          onClick={switchMode}
          className="text-blue-600 hover:underline"
        >
          Sign up
        </button>
      </p>
    </>
  );
}
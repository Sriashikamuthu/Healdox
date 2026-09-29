import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  switchMode: () => void;
  onClose: () => void;
}

export default function SignupForm({ switchMode, onClose }: Props) {

  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await signUp(
      email,
      password,
      username,
      fullName,
      role as any
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    console.log("Signup success");

    onClose();
    setLoading(false);
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>

      <form onSubmit={handleSignup} className="space-y-4">

        <input
          type="text"
          placeholder="Full Name"
          className="w-full border p-2 rounded"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Username"
          className="w-full border p-2 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <div>
          <label className="text-sm font-medium">I am a</label>
          <select
            className="w-full border p-2 rounded mt-1"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="patient">Member</option>
            <option value="physician">Physician</option>
            <option value="nurse">Nurse</option>
            <option value="lab">Lab</option>
          </select>
        </div>

        {/* PROFILE PICTURE */}
        <div>
          <label className="text-sm font-medium">Profile Picture (Optional)</label>

          <div className="flex items-center gap-4 mt-2">

            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
              👤
            </div>

            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/gif"
              onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
            />
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Max 5MB, JPG, PNG or GIF
          </p>
        </div>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

      </form>

      <p className="text-center mt-4 text-sm">
        Already have an account?{" "}
        <button
          onClick={switchMode}
          className="text-blue-600 hover:underline"
        >
          Sign in
        </button>
      </p>
    </>
  );
}
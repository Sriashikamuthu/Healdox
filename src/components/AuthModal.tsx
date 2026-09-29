import { useEffect, useState } from "react";
import { X } from "lucide-react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
}: Props) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X />
        </button>

        {mode === "login" ? (
          <LoginForm
            switchMode={() => setMode("signup")}
            onClose={onClose}
          />
        ) : (
          <SignupForm
            switchMode={() => setMode("login")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
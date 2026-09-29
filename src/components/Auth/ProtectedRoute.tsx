import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  // Wait until auth state loads
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  // If not logged in, redirect to home
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
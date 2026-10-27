import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { API_BASE } from "../lib/api";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  full_name?: string | null;
  role?: string;
  avatar_url?: string;
  is_verified?: boolean;
  specialty?: string | null;
  medicine_system?: string | null;
  bio?: string | null;
  license_number?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthUser | null;
  token: string | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    role: string
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(raw: any): AuthUser {
  return {
    id: String(raw.id),
    email: raw.email,
    username: raw.username,
    avatar_url: raw.avatar_url || "",
    fullName: raw.fullName || raw.full_name || "",
    full_name: raw.full_name || raw.fullName || "",
    role: raw.role || "patient",
    is_verified: raw.is_verified !== false,
    specialty: raw.specialty || null,
    medicine_system: raw.medicine_system || null,
    bio: raw.bio || null,
    license_number: raw.license_number || null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (
        storedUser &&
        storedUser !== "undefined" &&
        storedUser !== "null"
      ) {
        setUser(normalizeUser(JSON.parse(storedUser)));
      } else {
        setUser(null);
      }

      setToken(localStorage.getItem("token"));
    } catch (error) {
      console.error("Invalid user in localStorage", error);
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    role: string
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          fullName,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          error: new Error(data.error || "Signup failed"),
        };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          error: new Error(data.error || "Login failed"),
        };
      }

      if (!data.token) {
        return {
          error: new Error("Login response did not include an authentication token"),
        };
      }

      const userData = normalizeUser(data.user || data);

      setUser(userData);
      setToken(data.token);

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", data.token);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const profile = useMemo(() => user, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        setUser,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

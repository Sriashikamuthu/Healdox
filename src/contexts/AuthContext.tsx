import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  role?: string;
  avatar_url?: string; // ✅ ADD THIS
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>; // ✅ ADD THIS
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

export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     Load user from localStorage
  ========================= */
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (
        storedUser &&
        storedUser !== "undefined" &&
        storedUser !== "null"
      ) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Invalid user in localStorage", err);
      localStorage.removeItem("user");
      setUser(null);
    }

    setLoading(false);
  }, []);

  /* =========================
     SIGNUP
  ========================= */
  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    role: string
  ) => {
    try {
      const res = await fetch("http://localhost:5000/auth/signup", {
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
        return { error: new Error(data.error) };
      }

      return { error: null };

    } catch (error) {
      return { error: error as Error };
    }
  };

  /* =========================
     LOGIN (FIXED)
  ========================= */
  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);
      console.log("USER:", data.user);

      if (!res.ok) {
        return {
          error: new Error(data.error || "Login failed")
        };
      }

      const loginUser = data.user || data;

      const userData: User = {
        id: loginUser.id,
        email: loginUser.email,
        username: loginUser.username,
        avatar_url: loginUser.avatar_url || "",
        fullName: loginUser.fullName || "",
        role: loginUser.role || "patient"
      };

      setUser(userData);

      localStorage.setItem(
        "user",
        JSON.stringify(userData)
      );

      console.log("LOGIN USER:", userData);

      return { error: null };

    } catch (error) {

      console.error(error);

      return {
        error: error as Error
      };

    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const signOut = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser, // ✅ important
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

/* =========================
   HOOK
========================= */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
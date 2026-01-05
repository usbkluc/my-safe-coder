import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  signup: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Simple hash function for password (in production, use proper hashing on server)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("ai_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      const passwordHash = await hashPassword(password);
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, password_hash")
        .eq("username", username.toLowerCase())
        .single();

      if (error || !data) {
        return { error: "Nesprávne meno alebo heslo" };
      }

      if (data.password_hash !== passwordHash) {
        return { error: "Nesprávne meno alebo heslo" };
      }

      const userData = { id: data.id, username: data.username };
      setUser(userData);
      localStorage.setItem("ai_user", JSON.stringify(userData));
      return {};
    } catch (err) {
      console.error("Login error:", err);
      return { error: "Nastala chyba pri prihlásení" };
    }
  };

  const signup = async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      // Check if username exists
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .single();

      if (existing) {
        return { error: "Toto meno je už obsadené" };
      }

      const passwordHash = await hashPassword(password);
      
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          username: username.toLowerCase(),
          password_hash: passwordHash,
        })
        .select("id, username")
        .single();

      if (error) {
        console.error("Signup error:", error);
        return { error: "Nastala chyba pri registrácii" };
      }

      const userData = { id: data.id, username: data.username };
      setUser(userData);
      localStorage.setItem("ai_user", JSON.stringify(userData));
      return {};
    } catch (err) {
      console.error("Signup error:", err);
      return { error: "Nastala chyba pri registrácii" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("ai_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

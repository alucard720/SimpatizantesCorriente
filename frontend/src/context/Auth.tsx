import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";
import { api, send } from "../services/api";
const Context = createContext<{
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
} | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    void api<User>("/auth/me")
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  const login = async (email: string, password: string) => {
    const data = await send<User>("/auth/login", { email, password });
    setUser(data);
    return data;
  };
  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };
  return (
    <Context.Provider value={{ user, loading, login, logout }}>
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => {
  const value = useContext(Context);
  if (!value) throw new Error("Falta AuthProvider");
  return value;
};

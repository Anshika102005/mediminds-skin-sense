import React, { createContext, useContext, useState, useEffect } from "react";

export interface UserSession {
  id: string;
  email: string;
  full_name: string;
  role: "patient" | "doctor" | "nurse" | "staff" | "admin";
  phone?: string;
  org_id?: string;
  org_name?: string;
  patient_id?: string;
  professional_id?: string;
  role_title?: string;
  department?: string;
}

interface AuthContextType {
  user: UserSession | null;
  login: (user: UserSession) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isProfessional: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
  isProfessional: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("mediminds-auth");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem("mediminds-auth", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mediminds-auth");
  };

  const isProfessional = user?.role === "doctor" || user?.role === "nurse" || user?.role === "staff" || user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isProfessional }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { createContext, useContext, useMemo, useState } from "react";

export type Role = "Student" | "Teacher";

export type TeacherProfile = {
  subjects: string[]; // ["Mathe", "Englisch"]
  hourlyRate: number; // 25
  city: string; // "Berlin"
  bio?: string;
};

export type StudentPrefs = {
  subjects: string[]; // wonach sucht der Schüler
  city: string;
  availabilityMinutesFromNow: number; // spontane: in wie vielen Minuten möglich
};

export type User = {
  name: string;
  email: string;
  role: Role;
  teacherProfile?: TeacherProfile;
  studentPrefs?: StudentPrefs;
};

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;

  updateTeacherProfile: (p: TeacherProfile) => void;
  updateStudentPrefs: (p: StudentPrefs) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const updateTeacherProfile = (p: TeacherProfile) => {
    setUser((prev) => (prev ? { ...prev, teacherProfile: p } : prev));
  };

  const updateStudentPrefs = (p: StudentPrefs) => {
    setUser((prev) => (prev ? { ...prev, studentPrefs: p } : prev));
  };

  const value = useMemo(
    () => ({ user, setUser, updateTeacherProfile, updateStudentPrefs }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

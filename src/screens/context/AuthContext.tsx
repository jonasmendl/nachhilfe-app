import React, { createContext, useContext, useMemo, useState } from "react";

export type Role = "Student" | "Teacher";

export type TeacherProfile = {
  subjects: string[];
  hourlyRate: number;
  city: string;
  bio?: string;
};

export type StudentPrefs = {
  subjects: string[];
  city: string;
  availabilityMinutesFromNow: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  teacherProfile?: TeacherProfile;
  studentPrefs?: StudentPrefs;
};

type AuthContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;

  // ✅ Demo helpers
  loginDemoStudent: () => void;
  loginDemoTeacher: () => void;
  logout: () => void;

  updateTeacherProfile: (p: TeacherProfile) => void;
  updateStudentPrefs: (p: StudentPrefs) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const loginDemoStudent = () => {
    setUser({
      id: "s1",
      name: "Demo Schüler",
      email: "student@demo.local",
      role: "Student",
      studentPrefs: {
        subjects: ["Mathe"],
        city: "Berlin",
        availabilityMinutesFromNow: 120,
      },
    });
  };

  const loginDemoTeacher = () => {
    setUser({
      id: "t1",
      name: "Demo Lehrer",
      email: "teacher@demo.local",
      role: "Teacher",
      teacherProfile: {
        subjects: ["Mathe", "Englisch"],
        hourlyRate: 25,
        city: "Berlin",
        bio: "Ich helfe bei Realschul- & Gymnasial-Nachhilfe, spontan & freundlich 🙂",
      },
    });
  };

  const logout = () => setUser(null);

  const updateTeacherProfile = (p: TeacherProfile) => {
    setUser((prev) => (prev ? { ...prev, teacherProfile: p } : prev));
  };

  const updateStudentPrefs = (p: StudentPrefs) => {
    setUser((prev) => (prev ? { ...prev, studentPrefs: p } : prev));
  };

  const value = useMemo(
    () => ({
      user,
      setUser,
      loginDemoStudent,
      loginDemoTeacher,
      logout,
      updateTeacherProfile,
      updateStudentPrefs,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

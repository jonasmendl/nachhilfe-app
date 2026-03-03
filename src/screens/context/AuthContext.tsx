// src/screens/context/AuthContext.tsx
import React, { createContext, useContext, useState, useMemo } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-expo";

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

// Das gewohnte User-Objekt bleibt für den Rest deiner App bestehen
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
  logout: () => void;
  updateTeacherProfile: (p: TeacherProfile) => void;
  updateStudentPrefs: (p: StudentPrefs) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 100% Clerk für die Authentifizierung
  const { user: clerkUser } = useUser();
  const { signOut } = useClerkAuth();

  // Lokale Zwischenspeicher für die Profileinstellungen (z.B. für ProfileScreen)
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | undefined>(undefined);
  const [studentPrefs, setStudentPrefs] = useState<StudentPrefs | undefined>(undefined);

  const logout = async () => {
    await signOut();
  };

  const updateTeacherProfile = (p: TeacherProfile) => setTeacherProfile(p);
  const updateStudentPrefs = (p: StudentPrefs) => setStudentPrefs(p);

  // Wir bauen dein altes User-Objekt dynamisch aus den echten Clerk-Daten!
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.firstName || "User",
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    // Die Rolle wird bei Registrierung meist in die Metadaten geschrieben:
    role: (clerkUser.unsafeMetadata?.role as Role) || (clerkUser.publicMetadata?.role as Role) || "Student",
    teacherProfile,
    studentPrefs,
  } : null;

  const value = useMemo(
    () => ({
      user,
      logout,
      updateTeacherProfile,
      updateStudentPrefs,
    }),
    [user, teacherProfile, studentPrefs]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
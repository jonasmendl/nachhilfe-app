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
  const { user: clerkUser } = useUser();
  const { signOut } = useClerkAuth();

  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | undefined>(undefined);
  const [studentPrefs, setStudentPrefs] = useState<StudentPrefs | undefined>(undefined);

  const logout = async () => {
    await signOut();
  };

  const updateTeacherProfile = (p: TeacherProfile) => setTeacherProfile(p);
  const updateStudentPrefs = (p: StudentPrefs) => setStudentPrefs(p);

  // ✅ NEU: Hier lesen wir den Namen korrekt aus den Metadaten, 
  // die du im SignUpScreen gespeichert hast!
  const getFullName = () => {
    if (!clerkUser) return "User";
    const metaName = clerkUser.unsafeMetadata?.fullName || clerkUser.publicMetadata?.fullName;
    if (metaName) return String(metaName);
    return clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : "User";
  };

  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    name: getFullName(), // Jetzt wird der echte Name verwendet!
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
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
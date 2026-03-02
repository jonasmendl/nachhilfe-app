// src/screens/context/AppDataContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import {
  likeTeacher as apiLikeTeacher,
  getTeacherRequests as apiGetTeacherRequests,
  acceptRequest as apiAcceptRequest,
  rejectRequest as apiRejectRequest,
  getStudentMatches as apiGetStudentMatches,
} from "../api/api";

export type RequestStatus = "pending" | "accepted" | "rejected";

export type Request = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  city: string;
  when: string;
  status: RequestStatus;
  contact?: string;
  createdAt: number;
};

type AppDataContextValue = {
  requests: Request[];
  likeTeacher: (studentId: string, teacherId: string) => Promise<void>;
  refreshTeacherRequests: (teacherId: string) => Promise<void>;
  refreshStudentMatches: (studentId: string) => Promise<void>;
  acceptRequest: (likeId: string) => Promise<void>;
  rejectRequest: (likeId: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<Request[]>([]);

  const likeTeacher = async (studentId: string, teacherId: string) => {
    await apiLikeTeacher(studentId, teacherId);
  };

  const refreshTeacherRequests = async (teacherId: string) => {
    try {
      const data = await apiGetTeacherRequests(teacherId);
      if (!Array.isArray(data)) return;
      setRequests(data.map((r: any) => ({
        id: String(r.id ?? r.likeId ?? ""),
        studentId: String(r.studentId ?? ""),
        studentName: String(r.studentName ?? ""),
        teacherId: String(r.teacherId ?? ""),
        teacherName: String(r.teacherName ?? ""),
        subject: String(r.subject ?? ""),
        city: String(r.city ?? ""),
        when: String(r.when ?? ""),
        status: (r.status ?? "pending") as RequestStatus,
        contact: r.contact ?? "",
        createdAt: Number(r.createdAt ?? Date.now()),
      })));
    } catch {}
  };

  const refreshStudentMatches = async (studentId: string) => {
    try {
      const data = await apiGetStudentMatches(studentId);
      if (!Array.isArray(data)) return;
      setRequests(data.map((r: any) => ({
        id: String(r.id ?? r.likeId ?? ""),
        studentId: String(r.studentId ?? ""),
        studentName: String(r.studentName ?? ""),
        teacherId: String(r.teacherId ?? ""),
        teacherName: String(r.teacherName ?? ""),
        subject: String(r.subject ?? ""),
        city: String(r.city ?? ""),
        when: String(r.when ?? ""),
        status: (r.status ?? "pending") as RequestStatus,
        contact: r.contact ?? "",
        createdAt: Number(r.createdAt ?? Date.now()),
      })));
    } catch {}
  };

  const acceptRequest = async (likeId: string) => {
    await apiAcceptRequest(likeId);
    setRequests(prev => prev.map(r => r.id === likeId ? { ...r, status: "accepted" } : r));
  };

  const rejectRequest = async (likeId: string) => {
    await apiRejectRequest(likeId);
    setRequests(prev => prev.map(r => r.id === likeId ? { ...r, status: "rejected" } : r));
  };

  const value = useMemo(() => ({
    requests,
    likeTeacher,
    refreshTeacherRequests,
    refreshStudentMatches,
    acceptRequest,
    rejectRequest,
  }), [requests]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
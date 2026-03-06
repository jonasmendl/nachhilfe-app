// src/screens/context/AppDataContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import {
  likeTeacher as apiLikeTeacher,
  getTeacherRequests as apiGetTeacherRequests,
  setRequestStatus as apiSetRequestStatus,
  getStudentMatches as apiGetStudentMatches,
  getTeachers as apiGetTeachers,
} from "../api/api";

export type RequestStatus = "pending" | "accepted" | "declined";

export type Request = {
  id: string;
  requestId: string;
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
  likeTeacher: (studentId: string, studentName: string, teacherId: string) => Promise<void>;
  refreshTeacherRequests: (teacherId: string) => Promise<void>;
  refreshStudentMatches: (studentId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<Request[]>([]);

  const likeTeacher = async (studentId: string, studentName: string, teacherId: string) => {
    await apiLikeTeacher(studentId, studentName, teacherId);
  };

  const refreshTeacherRequests = async (teacherId: string) => {
    try {
      const data = await apiGetTeacherRequests(teacherId);
      if (!Array.isArray(data)) return;
      
      // 👻 FIX: Geister-Zeilen ohne IDs sofort rausfiltern!
      const validRequests = data.filter((r: any) => r && r.requestId && r.studentId);

      setRequests(validRequests.map((r: any) => ({
        id: String(r.id ?? r.requestId ?? ""),
        requestId: String(r.requestId ?? r.id ?? ""),
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
      const matchesData = await apiGetStudentMatches(studentId);
      const teachersData = await apiGetTeachers();

      if (!Array.isArray(matchesData)) return;
      const teacherList = Array.isArray(teachersData) ? teachersData : [];

      // 👻 FIX: Geister-Zeilen ohne IDs sofort rausfiltern!
      const validMatches = matchesData.filter((r: any) => r && r.requestId && r.teacherId);

      setRequests(validMatches.map((r: any) => {
        const teacher = teacherList.find(t => t.teacherId === r.teacherId);

        return {
          id: String(r.id ?? r.requestId ?? ""),
          requestId: String(r.requestId ?? r.id ?? ""),
          studentId: String(r.studentId ?? ""),
          studentName: String(r.studentName ?? ""),
          teacherId: String(r.teacherId ?? ""),
          teacherName: String(r.teacherName ?? teacher?.name ?? "Lehrer"), 
          subject: String(r.subject ?? teacher?.subject ?? ""),
          city: String(r.city ?? teacher?.city ?? ""),
          when: String(r.when ?? ""),
          status: (r.status ?? "pending") as RequestStatus,
          contact: String(r.contact ?? teacher?.contact ?? ""), 
          createdAt: Number(r.createdAt ?? Date.now()),
        };
      }));
    } catch (e) {
      console.error("Fehler beim Laden der Matches:", e);
    }
  };

  const acceptRequest = async (requestId: string) => {
    await apiSetRequestStatus(requestId, "accepted");
    setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: "accepted" } : r));
  };

  const rejectRequest = async (requestId: string) => {
    await apiSetRequestStatus(requestId, "declined");
    setRequests(prev => prev.map(r => r.requestId === requestId ? { ...r, status: "declined" } : r));
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
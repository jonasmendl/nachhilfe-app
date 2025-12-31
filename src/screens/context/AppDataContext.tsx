import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

import {
  getRequests as apiGetRequests,
  createRequest as apiCreateRequest,
  patchRequest as apiPatchRequest,
  createChat as apiCreateChat,
  getChats as apiGetChats,
  getMessages as apiGetMessages,
  sendMessage as apiSendMessage,
} from "../api/api";

export type RequestStatus = "pending" | "accepted" | "rejected";

export type Request = {
  id: any;
  studentId: any;
  studentName?: string;
  teacherId: any;
  teacherName?: string;
  subject: string;
  city?: string;
  when?: string;
  status: RequestStatus;
  createdAt?: any;
};

export type Chat = {
  id: any;
  title: string;
  requestId: any;
  studentId: any;
  teacherId: any;
  createdAt?: any;
};

export type Message = {
  id: any;
  chatId: any;
  senderId: any;
  text: string;
  createdAt?: any;
};

type CreateRequestArgs = {
  studentId: any;
  studentName?: string;
  teacherId: any;
  teacherName?: string;
  subject: string;
  city?: string;
  when?: string;
};

type AppData = {
  requests: Request[];
  chats: Chat[];
  messages: Message[];

  reloadAll: () => Promise<void>;

  createRequest: (args: CreateRequestArgs) => Promise<Request>;
  acceptRequest: (request: Request) => Promise<Chat>;
  rejectRequest: (request: Request) => Promise<void>;

  loadMessages: (chatId: any) => Promise<Message[]>;
  sendMessage: (chatId: any, senderId: any, text: string) => Promise<Message>;
  messagesForChat: (chatId: any) => Message[];

  addDemoRequestForTeacher: (teacherId: any, teacherName?: string) => Promise<void>;

  resetAllLocal: () => void; // nur UI Reset
};

const Ctx = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const myId = (user?.id ?? user?.uid ?? null) as any;

  const reloadAll = async () => {
    const reqs = await apiGetRequests();
    setRequests(reqs);

    if (myId != null) {
      const ch = await apiGetChats(myId);
      setChats(ch);
    } else {
      setChats([]);
    }
  };

  // initial load + wenn user wechselt
  useEffect(() => {
    reloadAll().catch((e) => console.error("❌ reloadAll failed:", e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const createRequest: AppData["createRequest"] = async (args) => {
    const created = await apiCreateRequest({
      ...args,
      status: "pending",
    });

    setRequests((prev) => [...prev, created]);
    return created;
  };

  const acceptRequest: AppData["acceptRequest"] = async (request) => {
    const chat = await apiCreateChat({
      requestId: request.id,
      studentId: request.studentId,
      teacherId: request.teacherId,
      title: `Chat mit ${request.studentName ?? "Student"} (${request.subject})`,
    });

    // Requests neu ziehen (damit status accepted stimmt)
    const reqs = await apiGetRequests();
    setRequests(reqs);

    // Chats neu ziehen (damit Teacher/Student den Chat sieht)
    if (myId != null) {
      const ch = await apiGetChats(myId);
      setChats(ch);
    } else {
      setChats([]);
    }

    return chat;
  };

  const rejectRequest: AppData["rejectRequest"] = async (request) => {
    await apiPatchRequest(request.id, { status: "rejected" });

    setRequests((prev) =>
      prev.map((r) => (String(r.id) === String(request.id) ? { ...r, status: "rejected" } : r))
    );
  };

  const loadMessages: AppData["loadMessages"] = async (chatId) => {
    const list = await apiGetMessages(chatId);
    // MVP: wir halten nur die Messages des zuletzt geöffneten Chats im State
    setMessages(list);
    return list;
  };

  const sendMessage: AppData["sendMessage"] = async (chatId, senderId, text) => {
    const t = text.trim();
    if (!t) throw new Error("Empty message");

    const msg = await apiSendMessage(chatId, { senderId, text: t });

    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  // ✅ DAS hat dir gefehlt:
  const messagesForChat: AppData["messagesForChat"] = (chatId) => {
    return (messages ?? [])
      .filter((m) => String(m.chatId) === String(chatId))
      .sort((a, b) => (Number(a.createdAt ?? 0) - Number(b.createdAt ?? 0)));
  };

  const addDemoRequestForTeacher: AppData["addDemoRequestForTeacher"] = async (
    teacherId,
    teacherName
  ) => {
    await createRequest({
      studentId: "s_demo",
      studentName: "Jonas (Demo)",
      teacherId,
      teacherName: teacherName ?? "Teacher",
      subject: "Mathe",
      city: "Berlin",
      when: "morgen 16:00",
    });
  };

  const resetAllLocal = () => {
    setRequests([]);
    setChats([]);
    setMessages([]);
  };

  const value = useMemo<AppData>(
    () => ({
      requests,
      chats,
      messages,
      reloadAll,
      createRequest,
      acceptRequest,
      rejectRequest,
      loadMessages,
      sendMessage,
      messagesForChat, // ✅ UND das musst du exportieren
      addDemoRequestForTeacher,
      resetAllLocal,
    }),
    [requests, chats, messages]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used inside AppDataProvider");
  return v;
}

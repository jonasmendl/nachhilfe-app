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
  id: string;
  studentId: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;
  subject?: string;
  city?: string;
  when?: string;
  status: RequestStatus;
  createdAt?: string;
};

export type Chat = {
  id: string;
  requestId: string;
  studentId: string;
  teacherId: string;
  createdAt?: string;
  title?: string;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt?: string;
};

type CreateRequestArgs = {
  studentId: string;
  studentName?: string;
  teacherId: string;
  teacherName?: string;
  subject?: string;
  city?: string;
  when?: string;
};

type AppData = {
  requests: Request[];
  chats: Chat[];
  messages: Message[];

  reloadAll: () => Promise<void>;
  reloadRequestsForTeacher: (teacherId: string) => Promise<Request[]>;
  reloadChatsForMe: () => Promise<Chat[]>;

  createRequest: (args: CreateRequestArgs) => Promise<Request>;
  acceptRequest: (request: Request) => Promise<Chat>;
  rejectRequest: (request: Request) => Promise<void>;

  loadMessages: (chatId: string) => Promise<Message[]>;
  sendMessage: (chatId: string, senderId: string, text: string) => Promise<Message>;
  messagesForChat: (chatId: string) => Message[];

  resetAllLocal: () => void;
};

const Ctx = createContext<AppData | null>(null);

/* ---------------- Helpers ---------------- */

function isAbortError(e: any) {
  const msg = String(e?.message || e);
  return msg.includes("AbortError") || msg.toLowerCase().includes("aborted");
}

/* ---------------- Normalizer (snake_case -> camelCase) ---------------- */

function normRequest(r: any): Request {
  return {
    id: String(r.id),
    studentId: String(r.studentId ?? r.student_id ?? ""),
    studentName: r.studentName ?? r.student_name ?? undefined,
    teacherId: String(r.teacherId ?? r.teacher_id ?? ""),
    teacherName: r.teacherName ?? r.teacher_name ?? undefined,
    subject: r.subject ?? undefined,
    city: r.city ?? undefined,
    when: r.when ?? undefined,
    status: (r.status ?? "pending") as RequestStatus,
    createdAt: r.createdAt ?? r.created_at ?? undefined,
  };
}

function normChat(c: any): Chat {
  return {
    id: String(c.id),
    requestId: String(c.requestId ?? c.request_id ?? ""),
    studentId: String(c.studentId ?? c.student_id ?? ""),
    teacherId: String(c.teacherId ?? c.teacher_id ?? ""),
    createdAt: c.createdAt ?? c.created_at ?? undefined,
    title: c.title ?? undefined,
  };
}

function normMessage(m: any): Message {
  return {
    id: String(m.id),
    chatId: String(m.chatId ?? m.chat_id ?? ""),
    senderId: String(m.senderId ?? m.sender_id ?? ""),
    text: String(m.text ?? ""),
    createdAt: m.createdAt ?? m.created_at ?? undefined,
  };
}

/* ---------------- Provider ---------------- */

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const myId = String(user?.id ?? user?.uid ?? "");

  const reloadRequests = async () => {
    const raw = await apiGetRequests();
    const normalized = (Array.isArray(raw) ? raw : []).map(normRequest);
    setRequests(normalized);
    return normalized;
  };

  const reloadRequestsForTeacher: AppData["reloadRequestsForTeacher"] = async (teacherId) => {
    const raw = await apiGetRequests({ teacherId });
    const normalized = (Array.isArray(raw) ? raw : []).map(normRequest);
    setRequests(normalized);
    return normalized;
  };

  const reloadChatsForMe: AppData["reloadChatsForMe"] = async () => {
    if (!myId) {
      setChats([]);
      return [];
    }
    const raw = await apiGetChats(myId);
    const normalized = (Array.isArray(raw) ? raw : []).map(normChat);
    setChats(normalized);
    return normalized;
  };

  const reloadAll: AppData["reloadAll"] = async () => {
    if (!myId) {
      setRequests([]);
      setChats([]);
      setMessages([]);
      return;
    }

    // parallel = schneller und weniger "hängen"
    await Promise.all([reloadRequests(), reloadChatsForMe()]);
  };

  useEffect(() => {
    reloadAll().catch((e) => {
      if (isAbortError(e)) return;
      console.error("❌ reloadAll failed:", e);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myId]);

  const createRequest: AppData["createRequest"] = async (args) => {
    const createdRaw = await apiCreateRequest({
      studentId: args.studentId,
      studentName: args.studentName,
      teacherId: args.teacherId,
      teacherName: args.teacherName,
      subject: args.subject,
      city: args.city,
      when: args.when,
    });

    const created = normRequest(createdRaw);
    setRequests((prev) => [created, ...prev]);
    return created;
  };

  const acceptRequest: AppData["acceptRequest"] = async (request) => {
    await apiPatchRequest(request.id, { status: "accepted" });

    const chatRaw = await apiCreateChat({
      requestId: request.id,
      studentId: request.studentId,
      teacherId: request.teacherId,
    });

    const chat = normChat(chatRaw);

    await reloadAll();
    return chat;
  };

  const rejectRequest: AppData["rejectRequest"] = async (request) => {
    await apiPatchRequest(request.id, { status: "rejected" });

    setRequests((prev) =>
      prev.map((r) => (r.id === request.id ? { ...r, status: "rejected" } : r))
    );
  };

  const loadMessages: AppData["loadMessages"] = async (chatId) => {
    const raw = await apiGetMessages(chatId);
    const normalized = (Array.isArray(raw) ? raw : []).map(normMessage);
    setMessages(normalized);
    return normalized;
  };

  const sendMessage: AppData["sendMessage"] = async (chatId, senderId, text) => {
    const t = text.trim();
    if (!t) throw new Error("Empty message");

    const raw = await apiSendMessage({ chatId, senderId, text: t });
    const msg = normMessage(raw);

    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const messagesForChat: AppData["messagesForChat"] = (chatId) => {
    return (messages ?? [])
      .filter((m) => m.chatId === String(chatId))
      .sort((a, b) => {
        const ta = Date.parse(a.createdAt ?? "") || 0;
        const tb = Date.parse(b.createdAt ?? "") || 0;
        return ta - tb;
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
      reloadRequestsForTeacher,
      reloadChatsForMe,
      createRequest,
      acceptRequest,
      rejectRequest,
      loadMessages,
      sendMessage,
      messagesForChat,
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

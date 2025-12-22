import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  createdAt: number;
};

export type Chat = {
  id: string;         // ✅ stabil: "c_" + requestId
  title: string;
  requestId: string;
  studentId: string;
  teacherId: string;
  createdAt: number;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
};

type CreateRequestArgs = Omit<Request, "id" | "status" | "createdAt">;

type AppData = {
  requests: Request[];
  chats: Chat[];
  messages: Message[];

  createRequest: (args: CreateRequestArgs) => void;

  // ✅ gibt Chat zurück -> direkt in ChatDetail navigieren
  acceptRequest: (requestId: string) => Chat | null;

  rejectRequest: (requestId: string) => void;

  sendMessage: (chatId: string, senderId: string, text: string) => void;
  messagesForChat: (chatId: string) => Message[];

  addDemoRequestForTeacher: (teacherId: string, teacherName: string) => void;

  resetAll: () => void;
};

const Ctx = createContext<AppData | null>(null);

// ✅ neuer Key -> alte Daten werden ignoriert
const STORAGE_KEY = "APP_DATA_V5";

// ✅ ID helper
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [requests, setRequests] = useState<Request[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setRequests(parsed.requests ?? []);
          setChats(parsed.chats ?? []);
          setMessages(parsed.messages ?? []);
        } else {
          setRequests([]);
          setChats([]);
          setMessages([]);
        }
      } catch {
        setRequests([]);
        setChats([]);
        setMessages([]);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Save
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ requests, chats, messages })).catch(() => {});
  }, [hydrated, requests, chats, messages]);

  const createRequest: AppData["createRequest"] = (args) => {
    const req: Request = {
      ...args,
      id: uid("r"),
      status: "pending",
      createdAt: Date.now(),
    };
    setRequests((prev) => [...prev, req]);
  };

  const acceptRequest: AppData["acceptRequest"] = (requestId) => {
    let createdChat: Chat | null = null;

    // ✅ alles aus prevReqs bauen -> nie stale
    setRequests((prevReqs) => {
      const req = prevReqs.find((r) => r.id === requestId);
      if (!req) return prevReqs;

      createdChat = {
        id: `c_${requestId}`, // ✅ stabil & wiederfindbar
        requestId,
        studentId: req.studentId,
        teacherId: req.teacherId,
        title: `Chat mit ${req.studentName} (${req.subject})`,
        createdAt: Date.now(),
      };

      setChats((prevChats) => {
        // ✅ Chat existiert schon?
        if (prevChats.some((c) => c.requestId === requestId)) return prevChats;
        return [...prevChats, createdChat as Chat];
      });

      // ✅ status accepted
      return prevReqs.map((r) => (r.id === requestId ? { ...r, status: "accepted" } : r));
    });

    return createdChat;
  };

  const rejectRequest: AppData["rejectRequest"] = (requestId) => {
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r)));
  };

  const sendMessage: AppData["sendMessage"] = (chatId, senderId, text) => {
    const t = text.trim();
    if (!t) return;

    const msg: Message = {
      id: uid("m"),
      chatId,
      senderId,
      text: t,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, msg]);
  };

  const messagesForChat: AppData["messagesForChat"] = (chatId) => {
    return messages
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => a.createdAt - b.createdAt);
  };

  const addDemoRequestForTeacher: AppData["addDemoRequestForTeacher"] = (teacherId, teacherName) => {
    createRequest({
      studentId: "s_demo",
      studentName: "Jonas (Demo)",
      teacherId,
      teacherName,
      subject: "Mathe",
      city: "Berlin",
      when: "morgen 16:00",
    });
  };

  const resetAll: AppData["resetAll"] = () => {
    setRequests([]);
    setChats([]);
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  };

  const value = useMemo<AppData>(
    () => ({
      requests,
      chats,
      messages,
      createRequest,
      acceptRequest,
      rejectRequest,
      sendMessage,
      messagesForChat,
      addDemoRequestForTeacher,
      resetAll,
    }),
    [requests, chats, messages]
  );

  if (!hydrated) return null;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used inside AppDataProvider");
  return v;
}

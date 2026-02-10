// src/context/AppDataContext.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import {
  getChats as apiGetChats,
  getMessages as apiGetMessages,
  sendMessage as apiSendMessage,
  createRequest as apiCreateRequest,
  createChat as apiCreateChat,
  patchRequest as apiPatchRequest,
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
  createdAt: number;
};

export type Chat = {
  id: string;
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  lastMessage?: string;
  updatedAt: number;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: number;
};

type CreateRequestInput = {
  studentId: string;
  studentName: string;
  teacherId: string;
  teacherName: string;
  subject: string;
  city: string;
  when: string;
};

type SendMessageInput = {
  chatId: string;
  senderId: string;
  text: string;
};

type AppDataContextValue = {
  requests: Request[];
  chats: Chat[];
  messagesByChatId: Record<string, Message[]>;

  createRequest: (input: CreateRequestInput) => Promise<Request>;
  acceptRequest: (requestOrId: any) => Promise<{ chatId: string }>;
  rejectRequest: (requestOrId: any) => Promise<void>;

  refreshChatsForUser: (userId: string) => Promise<void>;
  refreshMessages: (chatId: string, opts?: { force?: boolean }) => Promise<void>;
  sendMessage: (input: SendMessageInput) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function makeChatId(studentId: string, teacherId: string) {
  return `c_${studentId}_${teacherId}`;
}

function firstName(name: string) {
  const n = String(name || "").trim();
  if (!n) return "";
  return n.split(/\s+/)[0] || n;
}

function normalizeIncomingRequest(input: any): Request {
  const id = String(input?.id ?? uid("r"));
  const studentId = String(input?.studentId ?? input?.student_id ?? "s1");
  const teacherId = String(input?.teacherId ?? input?.teacher_id ?? "t1");

  const studentName = String(input?.studentName ?? input?.student_name ?? "Lena");
  const teacherName = String(input?.teacherName ?? input?.teacher_name ?? "Lisa");

  const subject = String(input?.subject ?? "Mathe");
  const city = String(input?.city ?? "Berlin");
  const when = String(input?.when ?? "Heute 16:30");
  const status = (String(input?.status ?? "pending") as RequestStatus) || "pending";
  const createdAt = Number(input?.createdAt ?? input?.created_at ?? Date.now());

  return {
    id,
    studentId,
    studentName,
    teacherId,
    teacherName,
    subject,
    city,
    when,
    status,
    createdAt,
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const now = Date.now();

  const seedChatId = makeChatId("s1", "t1");

  const [requests, setRequests] = useState<Request[]>(() => [
    {
      id: "r_demo_pending_1",
      studentId: "s2",
      studentName: "Noah",
      teacherId: "t1",
      teacherName: "Lisa",
      subject: "Mathe",
      city: "Berlin",
      when: "heute nachmittags",
      status: "pending",
      createdAt: now - 1000 * 60 * 18,
    },
    {
      id: "r_demo_pending_2",
      studentId: "s3",
      studentName: "Mia",
      teacherId: "t1",
      teacherName: "Lisa",
      subject: "Englisch",
      city: "Berlin",
      when: "so bald wie möglich",
      status: "pending",
      createdAt: now - 1000 * 60 * 9,
    },
  ]);

  const [chats, setChats] = useState<Chat[]>(() => [
    {
      id: seedChatId,
      studentId: "s1",
      studentName: "Lena",
      teacherId: "t1",
      teacherName: "Lisa",
      lastMessage: undefined,
      updatedAt: now - 1000 * 60 * 2,
    },
  ]);

  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, Message[]>>(() => ({
    [seedChatId]: [
      {
        id: "m_seed_1",
        chatId: seedChatId,
        senderId: "t1",
        text: "Hi 🙂 ich kann heute… 17:00–18:00?",
        createdAt: now - 1000 * 60 * 6,
      },
      {
        id: "m_seed_2",
        chatId: seedChatId,
        senderId: "s1",
        text: "Hi! Ja, 17:00 passt. Es geht um lineare Funktionen 🙈",
        createdAt: now - 1000 * 60 * 5,
      },
      {
        id: "m_seed_3",
        chatId: seedChatId,
        senderId: "t1",
        text: "Super. Schick mir kurz eine Aufgabe, dann starten wir direkt 👍",
        createdAt: now - 1000 * 60 * 4,
      },
    ],
  }));

  // ✅ NEU: loaded-Flag, damit auch leere Chats nicht dauernd re-fetch machen
  const [loadedMessagesByChatId, setLoadedMessagesByChatId] = useState<Record<string, boolean>>(() => ({
    [seedChatId]: true,
  }));

  const createRequest = async (input: CreateRequestInput) => {
    try {
      await apiCreateRequest(input as any);
    } catch {}

    const req: Request = {
      id: uid("r"),
      studentId: String(input.studentId),
      studentName: String(input.studentName),
      teacherId: String(input.teacherId),
      teacherName: String(input.teacherName),
      subject: String(input.subject),
      city: String(input.city),
      when: String(input.when),
      status: "pending",
      createdAt: Date.now(),
    };

    setRequests((prev) => [req, ...prev]);
    return req;
  };

  const ensureChatExists = (req: Request) => {
    const chatId = makeChatId(req.studentId, req.teacherId);

    setChats((prev) => {
      const exists = prev.some((c) => c.id === chatId);
      if (exists) {
        return prev
          .map((c) => (c.id === chatId ? { ...c, updatedAt: Date.now() } : c))
          .sort((a, b) => b.updatedAt - a.updatedAt);
      }

      const chat: Chat = {
        id: chatId,
        studentId: req.studentId,
        studentName: firstName(req.studentName) || req.studentName,
        teacherId: req.teacherId,
        teacherName: firstName(req.teacherName) || req.teacherName,
        lastMessage: undefined,
        updatedAt: Date.now(),
      };

      return [chat, ...prev];
    });

    // ✅ keine Auto-Message erzeugen (Chat startet leer)
    return chatId;
  };

  const acceptRequest = async (requestOrId: any) => {
    let req: Request | null = null;

    if (typeof requestOrId === "string") {
      const id = requestOrId;
      req = requests.find((r) => String(r.id) === String(id)) ?? null;
    } else {
      req = normalizeIncomingRequest(requestOrId);
    }

    if (!req) {
      req = {
        id: uid("r"),
        studentId: "s1",
        studentName: "Lena",
        teacherId: "t1",
        teacherName: "Lisa",
        subject: "Mathe",
        city: "Berlin",
        when: "Heute 17:00",
        status: "pending",
        createdAt: Date.now(),
      };
    }

    setRequests((prev) =>
      prev.map((r) => (String(r.id) === String(req!.id) ? { ...r, status: "accepted" } : r))
    );

    try {
      await apiPatchRequest(String(req.id), { status: "accepted" } as any);
    } catch {}

    const chatId = ensureChatExists({ ...req, status: "accepted" });

    try {
      await apiCreateChat({
        requestId: String(req.id),
        studentId: String(req.studentId),
        teacherId: String(req.teacherId),
        studentName: String(req.studentName),
        teacherName: String(req.teacherName),
        id: chatId,
      } as any);
    } catch {}

    // ✅ Markiere Messages als "noch nicht geladen" (damit initial 1x fetch gemacht wird)
    setLoadedMessagesByChatId((prev) => ({ ...prev, [chatId]: false }));

    return { chatId };
  };

  const rejectRequest = async (requestOrId: any) => {
    const req = typeof requestOrId === "string" ? requests.find((r) => r.id === requestOrId) : null;
    const normalized = req ? req : normalizeIncomingRequest(requestOrId);

    setRequests((prev) =>
      prev.map((r) => (String(r.id) === String(normalized.id) ? { ...r, status: "rejected" } : r))
    );

    try {
      await apiPatchRequest(String(normalized.id), { status: "rejected" } as any);
    } catch {}
  };

  const refreshChatsForUser = async (userId: string) => {
    try {
      const apiChats = await apiGetChats(String(userId));
      if (!Array.isArray(apiChats)) return;

      setChats((prev) => {
        const byId = new Map<string, Chat>();
        for (const c of prev) byId.set(c.id, c);

        for (const c of apiChats as any[]) {
          const normalized: Chat = {
            id: String(c.id),
            studentId: String(c.studentId ?? c.student_id ?? ""),
            teacherId: String(c.teacherId ?? c.teacher_id ?? ""),
            studentName: String(c.studentName ?? c.student_name ?? ""),
            teacherName: String(c.teacherName ?? c.teacher_name ?? ""),
            lastMessage: c.lastMessage ?? c.last_message ?? undefined,
            updatedAt: Number(c.updatedAt ?? c.updated_at ?? Date.now()),
          };

          if (!normalized.id || !normalized.studentId || !normalized.teacherId) continue;

          byId.set(normalized.id, normalized);
        }

        return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      });
    } catch {}
  };

  const refreshMessages = async (chatId: string, opts?: { force?: boolean }) => {
    if (!chatId) return;

    const force = Boolean(opts?.force);

    // ✅ wenn schon geladen (auch leere []), nicht jedes Mal neu laden
    if (!force && loadedMessagesByChatId[chatId]) return;

    try {
      const apiMsgs = await apiGetMessages(String(chatId));
      if (!Array.isArray(apiMsgs)) {
        setLoadedMessagesByChatId((prev) => ({ ...prev, [chatId]: true }));
        return;
      }

      setMessagesByChatId((prev) => {
        const normalized = (apiMsgs as any[]).map((m) => ({
          id: String(m.id ?? uid("m")),
          chatId: String(chatId),
          senderId: String(m.senderId ?? m.sender_id ?? "s1"),
          text: String(m.text ?? ""),
          createdAt: Number(m.createdAt ?? m.created_at ?? Date.now()),
        })) as Message[];

        return { ...prev, [chatId]: normalized.sort((a, b) => a.createdAt - b.createdAt) };
      });

      // ✅ loaded immer true setzen, auch wenn normalized = []
      setLoadedMessagesByChatId((prev) => ({ ...prev, [chatId]: true }));
    } catch {
      // bei Fehler nicht "loaded" setzen, damit Retry möglich bleibt
    }
  };

  const sendMessage = async (input: SendMessageInput) => {
    const msg: Message = {
      id: uid("m"),
      chatId: String(input.chatId),
      senderId: String(input.senderId),
      text: String(input.text),
      createdAt: Date.now(),
    };

    setMessagesByChatId((prev) => {
      const arr = prev[msg.chatId] ?? [];
      return { ...prev, [msg.chatId]: [...arr, msg] };
    });

    // ✅ sobald man schreibt, ist dieser Chat definitiv "geladen"
    setLoadedMessagesByChatId((prev) => ({ ...prev, [msg.chatId]: true }));

    setChats((prev) => {
      const next = prev.map((c) => (c.id === msg.chatId ? { ...c, updatedAt: Date.now() } : c));
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    });

    try {
      await apiSendMessage({ chatId: msg.chatId, senderId: msg.senderId, text: msg.text } as any);
    } catch {}
  };

  const value = useMemo(
    () => ({
      requests,
      chats,
      messagesByChatId,
      createRequest,
      acceptRequest,
      rejectRequest,
      refreshChatsForUser,
      refreshMessages,
      sendMessage,
    }),
    [requests, chats, messagesByChatId, loadedMessagesByChatId]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

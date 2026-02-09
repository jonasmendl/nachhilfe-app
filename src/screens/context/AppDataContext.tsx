import React, { createContext, useContext, useMemo, useState } from "react";
import {
  getChats as apiGetChats,
  getMessages as apiGetMessages,
  sendMessage as apiSendMessage,
  createRequest as apiCreateRequest,
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

  // ✅ accepts: requestId (string) ODER request object (any)
  acceptRequest: (requestOrId: any) => Promise<{ chatId: string }>;
  rejectRequest: (requestOrId: any) => Promise<void>;

  refreshChatsForUser: (userId: string) => Promise<void>;
  refreshMessages: (chatId: string) => Promise<void>;
  sendMessage: (input: SendMessageInput) => Promise<void>;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function makeChatId(studentId: string, teacherId: string) {
  return `c_${studentId}_${teacherId}`;
}

function normalizeIncomingRequest(input: any): Request {
  // supports snake_case from api + camelCase from app + demo
  const id = String(input?.id ?? uid("r"));
  const studentId = String(input?.studentId ?? input?.student_id ?? "s1");
  const teacherId = String(input?.teacherId ?? input?.teacher_id ?? "t1");
  const studentName = String(input?.studentName ?? input?.student_name ?? "Lena Fischer");
  const teacherName = String(input?.teacherName ?? input?.teacher_name ?? "Herr Bauer");
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
  // ✅ Demo seed: pending request (realistic name)
  const [requests, setRequests] = useState<Request[]>(() => {
    const now = Date.now();
    return [
      {
        id: "r_demo_1",
        studentId: "s1",
        studentName: "Lena Fischer",
        teacherId: "t1",
        teacherName: "Herr Bauer",
        subject: "Mathe",
        city: "Berlin",
        when: "Heute 16:30",
        status: "pending",
        createdAt: now - 1000 * 60 * 10,
      },
    ];
  });

  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, Message[]>>({});

  const createRequest = async (input: CreateRequestInput) => {
    // optional: hit fake api
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
        studentName: req.studentName,
        teacherId: req.teacherId,
        teacherName: req.teacherName,
        lastMessage: "Chat gestartet ✅",
        updatedAt: Date.now(),
      };

      return [chat, ...prev];
    });

    setMessagesByChatId((prev) => {
      if (prev[chatId]?.length) return prev;
      return {
        ...prev,
        [chatId]: [
          {
            id: uid("m"),
            chatId,
            senderId: req.teacherId,
            text: `Hi ${req.studentName}! Ich habe deine Anfrage gesehen 🙂 Worum geht’s genau?`,
            createdAt: Date.now(),
          },
        ],
      };
    });

    return chatId;
  };

  const acceptRequest = async (requestOrId: any) => {
    // ✅ supports acceptRequest("id") OR acceptRequest(requestObj)
    let req: Request | null = null;

    if (typeof requestOrId === "string") {
      const id = requestOrId;
      const found = requests.find((r) => String(r.id) === String(id)) ?? null;
      if (found) req = found;

      // mark accepted if exists
      if (found) {
        setRequests((prev) =>
          prev.map((r) => (String(r.id) === String(id) ? { ...r, status: "accepted" } : r))
        );
      }
    } else {
      // normalize request object from screen/api
      req = normalizeIncomingRequest(requestOrId);

      // ensure it's in state (so UI stays consistent)
      setRequests((prev) => {
        const exists = prev.some((r) => String(r.id) === String(req!.id));
        const acceptedReq = { ...req!, status: "accepted" as const };

        if (!exists) return [acceptedReq, ...prev];
        return prev.map((r) => (String(r.id) === String(req!.id) ? acceptedReq : r));
      });
    }

    // if still null (id not found), create a safe demo req
    if (!req) {
      req = {
        id: String(requestOrId ?? uid("r")),
        studentId: "s1",
        studentName: "Lena Fischer",
        teacherId: "t1",
        teacherName: "Herr Bauer",
        subject: "Mathe",
        city: "Berlin",
        when: "Heute 16:30",
        status: "accepted",
        createdAt: Date.now(),
      };

      setRequests((prev) => [{ ...req!, status: "accepted" }, ...prev]);
    }

    const chatId = ensureChatExists({ ...req, status: "accepted" });
    return { chatId };
  };

  const rejectRequest = async (requestOrId: any) => {
    if (typeof requestOrId === "string") {
      const id = requestOrId;
      setRequests((prev) =>
        prev.map((r) => (String(r.id) === String(id) ? { ...r, status: "rejected" } : r))
      );
      return;
    }

    const req = normalizeIncomingRequest(requestOrId);
    setRequests((prev) => {
      const exists = prev.some((r) => String(r.id) === String(req.id));
      const rejectedReq = { ...req, status: "rejected" as const };
      if (!exists) return [rejectedReq, ...prev];
      return prev.map((r) => (String(r.id) === String(req.id) ? rejectedReq : r));
    });
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
            studentId: String(c.studentId ?? c.student_id ?? "s1"),
            studentName: String(c.studentName ?? c.student_name ?? "Schüler"),
            teacherId: String(c.teacherId ?? c.teacher_id ?? "t1"),
            teacherName: String(c.teacherName ?? c.teacher_name ?? "Lehrer"),
            lastMessage: c.lastMessage ?? c.last_message ?? undefined,
            updatedAt: Number(c.updatedAt ?? c.updated_at ?? Date.now()),
          };
          byId.set(normalized.id, normalized);
        }

        return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      });
    } catch {}
  };

  const refreshMessages = async (chatId: string) => {
    try {
      const apiMsgs = await apiGetMessages(String(chatId));
      if (!Array.isArray(apiMsgs)) return;

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
    } catch {}
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

    setChats((prev) => {
      const next = prev.map((c) =>
        c.id === msg.chatId ? { ...c, lastMessage: msg.text, updatedAt: Date.now() } : c
      );
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
    [requests, chats, messagesByChatId]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

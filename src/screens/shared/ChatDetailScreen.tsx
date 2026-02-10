// src/screens/shared/ChatDetailScreen.tsx
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData, Message } from "../context/AppDataContext";
import { useNavigation, useRoute } from "@react-navigation/native";

function safeString(v: any) {
  try {
    if (v === null || v === undefined) return "";
    return String(v);
  } catch {
    return "";
  }
}

function firstName(fullName: any) {
  const s = String(fullName ?? "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0];
}

export default function ChatDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { user } = useAuth();
  const { chats, messagesByChatId, refreshMessages, sendMessage } = useAppData();

  // ✅ akzeptiert beide Varianten:
  // - navigation.navigate("ChatDetail", { chat })
  // - navigation.navigate("ChatDetail", { chatId })
  const routeChat = route?.params?.chat ?? null;
  const routeChatId = safeString(route?.params?.chatId ?? "");

  const chat = useMemo(() => {
    if (routeChat?.id) return routeChat;
    if (!routeChatId) return null;
    return chats.find((c: any) => safeString(c.id) === routeChatId) ?? null;
  }, [routeChat, routeChatId, chats]);

  const myId = useMemo(() => safeString((user as any)?.id ?? (user as any)?.uid ?? ""), [user]);
  const myRole = user?.role;

  const chatId = useMemo(() => safeString(chat?.id ?? routeChatId), [chat, routeChatId]);

  const otherDisplayName = useMemo(() => {
    if (!chat) return "Chat";
    if (myRole === "Teacher") return firstName(chat.studentName ?? "Schüler") || "Chat";
    return firstName(chat.teacherName ?? "Lehrer") || "Chat";
  }, [chat, myRole]);

  const title = useMemo(() => otherDisplayName || "Chat", [otherDisplayName]);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messages = useMemo<Message[]>(() => {
    if (!chatId) return [];
    const arr = messagesByChatId[chatId] ?? [];
    return [...arr].sort((a, b) => a.createdAt - b.createdAt);
  }, [messagesByChatId, chatId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  // ✅ Defensive: wenn chatId fehlt -> nie White Screen
  useEffect(() => {
    if (!chatId) {
      const t = setTimeout(() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.replace?.("MainTabs");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [chatId, navigation]);

  const load = useCallback(async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      setError(null);
      await refreshMessages(chatId);
    } catch (e: any) {
      setError(safeString(e?.message || e) || "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, [chatId, refreshMessages]);

  useEffect(() => {
    if (!chatId) return;
    void load();
  }, [chatId, load]);

  const onSend = useCallback(async () => {
    const t = text.trim();
    if (!t || !chatId || !myId) return;

    try {
      setSending(true);
      setText("");

      await sendMessage({ chatId, senderId: myId, text: t });

      void load();
    } catch (e: any) {
      Alert.alert("Fehler", safeString(e?.message || e) || "Nachricht konnte nicht gesendet werden.");
      void load();
    } finally {
      setSending(false);
    }
  }, [text, chatId, myId, sendMessage, load]);

  const renderItem = useCallback(
    ({ item }: { item: Message }) => {
      const isMe = safeString(item.senderId) === safeString(myId);
      return (
        <View
          style={{
            alignSelf: isMe ? "flex-end" : "flex-start",
            maxWidth: "80%",
            padding: 10,
            borderRadius: 12,
            backgroundColor: isMe ? "#c8f7c5" : "#eee",
          }}
        >
          <Text>{item.text}</Text>
        </View>
      );
    },
    [myId]
  );

  const emptyState = useMemo(() => {
    if (loading) {
      return (
        <View style={{ paddingVertical: 18, alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, opacity: 0.6 }}>Lade Nachrichten…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ paddingVertical: 18, alignItems: "center" }}>
          <Text style={{ color: "crimson", fontWeight: "800", textAlign: "center" }}>{error}</Text>

          <TouchableOpacity
            onPress={load}
            style={{
              marginTop: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#111",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>Erneut versuchen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
              else navigation.replace?.("MainTabs");
            }}
            style={{
              marginTop: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              backgroundColor: "#eee",
              borderRadius: 12,
            }}
          >
            <Text style={{ fontWeight: "800" }}>Zurück</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!messages.length) {
      return (
        <View style={{ paddingVertical: 18, alignItems: "center" }}>
          <Text style={{ opacity: 0.6 }}>Noch keine Nachrichten.</Text>
        </View>
      );
    }

    return null;
  }, [loading, error, messages.length, load, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "900" }}>{title}</Text>

          <TouchableOpacity
            onPress={load}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: "#eee",
              borderRadius: 10,
              opacity: loading ? 0.6 : 1,
            }}
            disabled={loading}
          >
            <Text style={{ fontWeight: "800" }}>{loading ? "..." : "Reload"}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(m) => safeString(m.id)}
          contentContainerStyle={{ gap: 10, paddingVertical: 10, paddingBottom: 20 }}
          renderItem={renderItem}
          ListEmptyComponent={emptyState}
          keyboardShouldPersistTaps="handled"
        />

        <View style={{ flexDirection: "row", gap: 10, paddingTop: 10 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Nachricht..."
            editable={!sending}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#ddd",
              borderRadius: 12,
              padding: 10,
              backgroundColor: "#fff",
            }}
            returnKeyType="send"
            onSubmitEditing={onSend}
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={sending || !text.trim()}
            style={{
              paddingHorizontal: 14,
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: sending || !text.trim() ? "#444" : "#111",
              opacity: sending || !text.trim() ? 0.7 : 1,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "800" }}>{sending ? "..." : "Senden"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

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
import { getMessages, sendMessage } from "../api/api";
import { useNavigation, useRoute } from "@react-navigation/native";

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

function safeString(v: any) {
  try {
    if (v === null || v === undefined) return "";
    return String(v);
  } catch {
    return "";
  }
}

export default function ChatDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { user } = useAuth();
  const chat = route?.params?.chat ?? null;

  const myId = useMemo(() => safeString(user?.id ?? (user as any)?.uid ?? "me"), [user]);
  const chatId = useMemo(() => safeString(chat?.id), [chat]);
  const title = useMemo(() => {
    const t = safeString(chat?.title);
    if (t) return t;
    if (chatId) return `Chat ${chatId.slice(0, 6)}`;
    return "Chat";
  }, [chat, chatId]);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ Setze Screen Titel und sichere Back-Navigation
  useLayoutEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  // ✅ Wenn chat/chatId fehlt -> sofort zurück (kein "Festhängen")
  useEffect(() => {
    if (!chat || !chatId) {
      // small delay damit Navigation stabil ist (Expo / RN Navigation race)
      const t = setTimeout(() => {
        if (navigation.canGoBack()) navigation.goBack();
        else navigation.replace?.("MainTabs");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [chat, chatId, navigation]);

  const load = useCallback(async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      setError(null);

      // ✅ Hard timeout damit "Lade Nachrichten…" nie ewig hängt
      const timeoutMs = 8000;
      const timeoutPromise = new Promise<MessageRow[]>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout beim Laden der Nachrichten.")), timeoutMs)
      );

      const data = (await Promise.race([getMessages(chatId), timeoutPromise])) as any;
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(safeString(e?.message || e) || "Unbekannter Fehler");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    load();
  }, [chatId, load]);

  const onSend = useCallback(async () => {
    const t = text.trim();
    if (!t || !chatId) return;

    try {
      setSending(true);

      const optimistic: MessageRow = {
        id: `temp-${Date.now()}`,
        chat_id: chatId,
        sender_id: myId,
        text: t,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimistic]);
      setText("");

      await sendMessage({ chatId, senderId: myId, text: t });

      // ✅ Soft refresh (kein Blocker)
      load();
    } catch (e: any) {
      Alert.alert("Fehler", safeString(e?.message || e) || "Nachricht konnte nicht gesendet werden.");
      load();
    } finally {
      setSending(false);
    }
  }, [text, chatId, myId, load]);

  const renderItem = useCallback(
    ({ item }: { item: MessageRow }) => {
      const isMe = safeString(item.sender_id) === myId;
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
          <Text style={{ color: "crimson", fontWeight: "800", textAlign: "center" }}>
            {error}
          </Text>
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
            <Text style={{ color: "#fff", fontWeight: "800" }}>
              {sending ? "..." : "Senden"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

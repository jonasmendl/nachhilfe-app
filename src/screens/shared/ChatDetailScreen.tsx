import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getMessages, sendMessage } from "../api/api"; // <-- Pfad ggf. anpassen!

type MessageRow = {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export default function ChatDetailsScreen({ route }: any) {
  const { user } = useAuth();
  const { chat } = route.params;

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const myId = (user?.id ?? user?.uid ?? "me") as string;
  const title = chat?.title ?? "Chat";
  const chatId = chat?.id;

  const load = async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getMessages(chatId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [chatId]);

  const onSend = async () => {
    const t = text.trim();
    if (!t || !chatId) return;

    try {
      setSending(true);

      // 1) Optimistic UI
      const optimistic: MessageRow = {
        id: `temp-${Date.now()}`,
        chat_id: String(chatId),
        sender_id: myId,
        text: t,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setText("");

      // 2) Persist via API
      await sendMessage({ chatId: String(chatId), senderId: myId, text: t });

      // 3) Reload (damit echte IDs/Sortierung passen)
      await load();
    } catch (e: any) {
      Alert.alert("Fehler", String(e?.message || e));
      // optional: reload um optimistic message ggf. zu entfernen
      await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "900", marginBottom: 10 }}>{title}</Text>

        <TouchableOpacity
          onPress={load}
          style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#eee", borderRadius: 10 }}
        >
          <Text style={{ fontWeight: "800" }}>Reload</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, opacity: 0.6 }}>Lade Nachrichten…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "crimson", fontWeight: "800", textAlign: "center" }}>
            Fehler: {error}
          </Text>
          <Text style={{ marginTop: 10, opacity: 0.6, textAlign: "center" }}>
            Prüfe: Backend läuft, API_BASE_URL stimmt, ChatId ist vorhanden.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
          renderItem={({ item }) => {
            const isMe = item.sender_id === myId;
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
          }}
        />
      )}

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
          }}
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={sending}
          style={{
            paddingHorizontal: 14,
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: sending ? "#444" : "#111",
            opacity: sending ? 0.7 : 1,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            {sending ? "..." : "Senden"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

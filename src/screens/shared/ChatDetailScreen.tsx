import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function ChatDetailsScreen({ route }: any) {
  const { user } = useAuth();
  const { messagesForChat, sendMessage } = useAppData(); // ✅ richtig

  const { chat } = route.params;
  const [text, setText] = useState("");

  const myId = (user?.id ?? user?.uid ?? "me") as string;
  const title = chat?.title ?? "Chat";

  // ✅ richtig
  const messages = messagesForChat(chat.id);

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    sendMessage(chat.id, myId, t);
    setText("");
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "900", marginBottom: 10 }}>{title}</Text>

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
        renderItem={({ item }) => {
          const isMe = item.senderId === myId;
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

      <View style={{ flexDirection: "row", gap: 10, paddingTop: 10 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Nachricht..."
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
          style={{
            paddingHorizontal: 14,
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: "#111",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800" }}>Senden</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

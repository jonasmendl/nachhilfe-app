import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function ChatsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { chats } = useAppData();

  const myId = (user?.id ?? user?.uid ?? "me") as string;

  // ✅ nur meine Chats (Request-Status ist EGAL)
  const visibleChats = useMemo(() => {
    return chats.filter(
      (c: any) => c.teacherId === myId || c.studentId === myId
    );
  }, [chats, myId]);

  const openChat = (chat: any) => {
    navigation.navigate("ChatDetail", { chat });
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "900", marginBottom: 12 }}>
        Chats
      </Text>

      <Text style={{ marginBottom: 10, opacity: 0.7 }}>
        MyId: {myId} | Chats: {chats.length} | Sichtbar: {visibleChats.length}
      </Text>

      {visibleChats.length === 0 ? (
        <Text style={{ opacity: 0.6 }}>Noch keine Chats.</Text>
      ) : (
        <FlatList
          data={visibleChats}
          keyExtractor={(c: any) => c.id}
          contentContainerStyle={{ gap: 12 }}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              onPress={() => openChat(item)}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800" }}>
                {item.title}
              </Text>
              <Text style={{ opacity: 0.6, marginTop: 4 }}>
                Tippe zum Öffnen
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

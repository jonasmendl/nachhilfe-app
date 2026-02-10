import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { useNavigation } from "@react-navigation/native";

function firstName(fullName: any) {
  const s = String(fullName ?? "").trim();
  if (!s) return "";
  return s.split(/\s+/)[0];
}

export default function ChatsScreen() {
  const { user } = useAuth();
  const { chats, refreshChatsForUser } = useAppData();
  const navigation = useNavigation<any>();

  const myId = String((user as any)?.id ?? (user as any)?.uid ?? "");
  const role = user?.role;

  useEffect(() => {
    if (!myId) return;
    void refreshChatsForUser(myId);
  }, [myId, refreshChatsForUser]);

  const myChats = useMemo(() => {
    if (!myId) return [];
    return chats.filter(
      (c) => String(c.studentId) === String(myId) || String(c.teacherId) === String(myId)
    );
  }, [chats, myId]);

  const openChat = (chat: any) => {
    navigation.navigate("ChatDetail", { chat });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>

      {myChats.length === 0 ? (
        <Text style={styles.empty}>Noch keine Chats.</Text>
      ) : (
        <FlatList
          data={myChats}
          keyExtractor={(item) => String(item.id)}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const other =
              role === "Teacher"
                ? firstName(item.studentName ?? "Schüler")
                : firstName(item.teacherName ?? "Lehrer");

            return (
              <TouchableOpacity style={styles.card} onPress={() => openChat(item)}>
                <Text style={styles.title}>{other || "Chat"}</Text>

                {/* ✅ MVP: Liste zeigt KEIN Preview, Text erst im Chat */}
                <Text style={styles.sub}>Tippe, um den Chat zu öffnen</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  empty: { opacity: 0.6, marginTop: 6 },

  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 16,
    padding: 14,
  },
  title: { fontSize: 18, fontWeight: "900" },
  sub: { opacity: 0.6, marginTop: 6 },
});

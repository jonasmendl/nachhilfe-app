// src/screens/teacher/TeacherInboxScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
// ✅ HIER ist der korrekte neue Import:
import { getTeacherRequests, setRequestStatus } from "../api/api"; 

export default function TeacherInboxScreen() {
  const { user } = useAuth();
  const teacherId = user?.id;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!teacherId) return;
    try {
      const data = await getTeacherRequests(teacherId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (requestId: string, status: "accepted" | "declined") => {
    try {
      // ✅ HIER rufen wir jetzt die neue Funktion auf:
      await setRequestStatus(requestId, status);
      setItems(prev => prev.map(item => item.requestId === requestId ? { ...item, status } : item));
      Alert.alert("Erfolg", `Anfrage wurde ${status === "accepted" ? "angenommen" : "abgelehnt"}.`);
    } catch (e) {
      Alert.alert("Fehler", "Status konnte nicht geändert werden.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f5f5f5" }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.requestId || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 40 }}>Keine Anfragen vorhanden.</Text>}
        renderItem={({ item }) => (
          <View style={{ padding: 16, backgroundColor: "#fff", marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: "#ddd" }}>
            <Text style={{ fontWeight: "bold", fontSize: 18 }}>{item.studentName}</Text>
            <Text style={{ marginVertical: 4 }}>Status: {item.status}</Text>
            {item.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable onPress={() => handleStatus(item.requestId, "declined")} style={{ flex: 1, padding: 12, backgroundColor: "#eee", borderRadius: 8 }}>
                  <Text style={{ textAlign: "center" }}>Ablehnen</Text>
                </Pressable>
                <Pressable onPress={() => handleStatus(item.requestId, "accepted")} style={{ flex: 1, padding: 12, backgroundColor: "#000", borderRadius: 8 }}>
                  <Text style={{ textAlign: "center", color: "#fff", fontWeight: "bold" }}>Annehmen</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
// src/screens/teacher/TeacherInboxScreen.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Linking, Pressable, RefreshControl, Text, View
} from "react-native";
import { useAuth } from "../context/AuthContext";
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
      await setRequestStatus(requestId, status);
      setItems(prev => prev.map(item => item.requestId === requestId ? { ...item, status } : item));
    } catch (e) {
      Alert.alert("Fehler", "Status konnte nicht geändert werden.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={items}
        // ✅ Fix: requestId nutzen, um Duplikate-Error zu vermeiden
        keyExtractor={(item) => String(item.requestId || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        renderItem={({ item }) => (
          <View style={{ padding: 16, backgroundColor: "#fff", marginBottom: 10, borderRadius: 12 }}>
            <Text style={{ fontWeight: "bold" }}>{item.studentName}</Text>
            <Text>Status: {item.status}</Text>
            {item.status === "pending" && (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable onPress={() => handleStatus(item.requestId, "declined")} style={{ flex: 1, padding: 10, backgroundColor: "#eee", borderRadius: 8 }}>
                  <Text style={{ textAlign: "center" }}>Ablehnen</Text>
                </Pressable>
                <Pressable onPress={() => handleStatus(item.requestId, "accepted")} style={{ flex: 1, padding: 10, backgroundColor: "#000", borderRadius: 8 }}>
                  <Text style={{ textAlign: "center", color: "#fff" }}>Annehmen</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
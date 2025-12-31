import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";

// 📱 Handy: Mac-IP
const API_BASE = "http://192.168.178.47:3000";

type RequestRow = {
  id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  subject?: string | null;
  city?: string | null;
  when?: string | null;
  status: string;
};

export default function TeacherRequestScreen() {
  const { user } = useAuth();
  const teacherId =
    (user?.id ??
      user?.uid ??
      "b8bdab57-8cd7-4183-b8b7-afb1bb885d6c") as string;

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/requests?teacherId=${teacherId}`);
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [teacherId]);

  const pending = useMemo(
    () => requests.filter((r) => r.status === "pending"),
    [requests]
  );

  const updateStatus = async (id: string, status: "accepted" | "rejected") => {
    await fetch(`${API_BASE}/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Lade Anfragen…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 12 }}>
        Anfragen
      </Text>

      {pending.length === 0 ? (
        <Text style={{ opacity: 0.6 }}>Keine offenen Anfragen</Text>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View
              style={{
                padding: 14,
                borderWidth: 1,
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontWeight: "800" }}>{item.student_name}</Text>
              <Text>
                {item.subject ?? "—"} • {item.city ?? "—"} • {item.when ?? "—"}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => {
                    updateStatus(item.id, "accepted");
                    Alert.alert("Angenommen");
                  }}
                  style={{
                    padding: 10,
                    backgroundColor: "#c8f7c5",
                    borderRadius: 10,
                  }}
                >
                  <Text>Annehmen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    updateStatus(item.id, "rejected");
                    Alert.alert("Abgelehnt");
                  }}
                  style={{
                    padding: 10,
                    backgroundColor: "#eee",
                    borderRadius: 10,
                  }}
                >
                  <Text>Ablehnen</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

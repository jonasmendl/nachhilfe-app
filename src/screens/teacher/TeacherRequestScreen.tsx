import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { useAppData } from "../context/AppDataContext";
import { getRequests } from "../api/api";

const TEACHER_ID = "b8bdab57-8cd7-4183-b8b7-afb1bb885d6c";
 // ✅ DEINE teacher UUID aus Supabase

export default function TeacherRequestScreen() {
  const { acceptRequest, rejectRequest } = useAppData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getRequests({ teacherId: TEACHER_ID });
      setRequests(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Anfragen</Text>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.sub}>Lade Anfragen…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Anfragen</Text>
        <Text style={styles.title}>Fehler 😅</Text>
        <Text style={styles.sub}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={load}>
          <Text style={styles.btnText}>Nochmal laden</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Anfragen</Text>
        <Text style={styles.title}>Keine Anfragen</Text>
        <Text style={styles.sub}>Für dich ist gerade nichts offen.</Text>
        <TouchableOpacity style={styles.btn} onPress={load}>
          <Text style={styles.btnText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Anfragen</Text>

      {requests.map((r) => (
        <View key={String(r.id)} style={styles.card}>
          <Text style={styles.name}>{r.studentName ?? "Schüler"}</Text>
          <Text style={styles.sub}>
            {r.subject ?? "—"} • {r.city ?? "—"}
          </Text>
          <Text style={styles.sub}>Status: {r.status ?? "—"}</Text>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.reject]}
              onPress={async () => {
                try {
                  await rejectRequest(r);
                  await load();
                } catch (e: any) {
                  Alert.alert("Fehler", String(e?.message || e));
                }
              }}
            >
              <Text style={styles.actionText}>Ablehnen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.accept]}
              onPress={async () => {
                try {
                  const chat = await acceptRequest(r);
                  await load();
                  Alert.alert("Angenommen ✅", `Chat erstellt: ${chat?.id ?? ""}`);
                } catch (e: any) {
                  Alert.alert("Fehler", String(e?.message || e));
                }
              }}
            >
              <Text style={styles.actionText}>Annehmen</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", marginTop: 12 },
  sub: { opacity: 0.65, marginTop: 6 },

  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 18, fontWeight: "900" },

  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  accept: { backgroundColor: "#c8f7c5" },
  reject: { backgroundColor: "#eee" },
  actionText: { fontWeight: "800" },

  btn: { marginTop: 14, backgroundColor: "#111", padding: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
});

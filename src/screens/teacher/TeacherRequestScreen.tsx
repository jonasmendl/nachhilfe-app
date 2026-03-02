// src/screens/teacher/TeacherRequestScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, FlatList, RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function TeacherRequestScreen() {
  const { user } = useAuth();
  const { requests, acceptRequest, rejectRequest, refreshTeacherRequests } = useAppData();
  const teacherId = String(user?.id ?? "");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (teacherId) refreshTeacherRequests(teacherId);
  }, [teacherId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTeacherRequests(teacherId);
    setRefreshing(false);
  };

  const pending = requests.filter(
    r => String(r.teacherId) === teacherId && r.status === "pending"
  );

  const renderItem = ({ item: r }: any) => (
    <View style={styles.card}>
      <Text style={styles.name}>{r.studentName}</Text>
      <Text style={styles.sub}>{r.subject} • {r.city}</Text>
      {!!r.when && <Text style={styles.when}>📅 {r.when}</Text>}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.reject]}
          onPress={async () => {
            try { await rejectRequest(r.id); }
            catch (e: any) { Alert.alert("Fehler", String(e?.message || e)); }
          }}
        >
          <Text style={styles.btnText}>Ablehnen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.accept]}
          onPress={async () => {
            try {
              await acceptRequest(r.id);
              Alert.alert("✅ Angenommen", "Der Schüler bekommt jetzt deine Kontaktdaten.");
            } catch (e: any) {
              Alert.alert("Fehler", String(e?.message || e));
            }
          }}
        >
          <Text style={styles.btnText}>Annehmen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Anfragen ({pending.length})</Text>

      {pending.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Keine offenen Anfragen.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
            <Text style={styles.refreshText}>Neu laden</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={r => String(r.id)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 16, padding: 14, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "900" },
  sub: { opacity: 0.65, marginTop: 4 },
  when: { marginTop: 4, opacity: 0.65 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  accept: { backgroundColor: "#c8f7c5" },
  reject: { backgroundColor: "#eee" },
  btnText: { fontWeight: "800" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { opacity: 0.5, fontSize: 16 },
  refreshBtn: { marginTop: 12, backgroundColor: "#111", padding: 12, borderRadius: 12 },
  refreshText: { color: "#fff", fontWeight: "800" },
});
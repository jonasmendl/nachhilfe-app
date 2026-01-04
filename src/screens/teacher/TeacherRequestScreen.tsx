import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { getRequests, getTeacherByAuth } from "../api/api";

export default function TeacherRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const { acceptRequest, rejectRequest } = useAppData();

  const authUid = String(user?.id ?? user?.uid ?? "");
  const [teacherRow, setTeacherRow] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const resolveTeacher = useCallback(async () => {
    if (!authUid) return null;
    const t = await getTeacherByAuth(authUid);
    setTeacherRow(t);
    return t;
  }, [authUid]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const t = teacherRow ?? (await resolveTeacher());
      const teacherId = String(t?.id ?? "");

      if (!teacherId) {
        setRequests([]);
        return;
      }

      const list = await getRequests({ teacherId });
      setRequests(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(String(e?.message || e));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [resolveTeacher, teacherRow]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingOnly = useMemo(
    () => (requests ?? []).filter((r) => (r.status ?? "pending") === "pending"),
    [requests]
  );

  const renderItem = ({ item: r }: any) => {
    const studentName = r.student_name ?? "Schüler";
    const subject = r.subject ?? "—";
    const city = r.city ?? "—";
    const status = r.status ?? "—";

    // normalized object for AppDataContext (camelCase)
    const normalized = {
      ...r,
      id: String(r.id),
      studentId: String(r.student_id ?? ""),
      teacherId: String(r.teacher_id ?? ""),
      studentName: r.student_name,
      teacherName: r.teacher_name,
    };

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{studentName}</Text>
        <Text style={styles.sub}>{subject} • {city}</Text>
        <Text style={styles.sub}>Status: {status}</Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.reject]}
            onPress={async () => {
              try {
                await rejectRequest(normalized);
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
                const chat = await acceptRequest(normalized);
                await load();
                if (chat?.id) navigation.navigate("ChatDetail", { chat });
              } catch (e: any) {
                Alert.alert("Fehler", String(e?.message || e));
              }
            }}
          >
            <Text style={styles.actionText}>Annehmen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Anfragen</Text>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.sub}>Lade Anfragen…</Text>
          <Text style={[styles.sub, { marginTop: 8 }]}>authUid: {authUid || "—"}</Text>
        </View>
      </View>
    );
  }

  if (error) {
    const isNotFound = error.includes("404");
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Anfragen</Text>
        <Text style={styles.title}>{isNotFound ? "Kein Teacher-Profil" : "Fehler 😅"}</Text>
        <Text style={styles.sub}>
          {isNotFound
            ? "Speichere zuerst dein Lehrerprofil, damit wir dich über auth_uid finden können."
            : error}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={load}>
          <Text style={styles.btnText}>Nochmal laden</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pendingOnly.length === 0) {
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

      <FlatList
        data={pendingOnly}
        keyExtractor={(r) => String(r.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "900", marginTop: 12 },
  sub: { opacity: 0.65, marginTop: 6, textAlign: "center" },

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

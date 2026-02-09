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

function demoFallbackRequests(teacherId: string, teacherName: string) {
  const tid = teacherId || "t1";
  const tname = teacherName || "Herr Bauer";

  return [
    {
      id: "r_demo_1",
      student_id: "s1",
      student_name: "Lena Fischer",
      teacher_id: tid,
      teacher_name: tname,
      subject: "Mathe",
      city: "Berlin",
      when: "Heute 16:30",
      status: "pending",
    },
  ];
}

export default function TeacherRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const { acceptRequest, rejectRequest } = useAppData();

  const authUid = String(user?.id ?? "");
  const fallbackTeacherId = String(user?.id ?? "t1");
  const fallbackTeacherName = String(user?.name ?? "Herr Bauer");

  const [teacherRow, setTeacherRow] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const resolveTeacher = useCallback(async () => {
    if (!authUid) {
      const t = { id: fallbackTeacherId, name: fallbackTeacherName };
      setTeacherRow(t);
      return t;
    }

    try {
      const t = await getTeacherByAuth(authUid);
      if (t?.id) {
        setTeacherRow(t);
        return t;
      }
    } catch {}

    const t = { id: fallbackTeacherId, name: fallbackTeacherName };
    setTeacherRow(t);
    return t;
  }, [authUid, fallbackTeacherId, fallbackTeacherName]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const t = teacherRow ?? (await resolveTeacher());
      const teacherId = String(t?.id ?? fallbackTeacherId);
      const teacherName = String(t?.name ?? fallbackTeacherName);

      let list: any[] = [];
      try {
        list = await getRequests({ teacherId });
      } catch {
        list = [];
      }

      const finalList =
        Array.isArray(list) && list.length > 0 ? list : demoFallbackRequests(teacherId, teacherName);

      setRequests(finalList);
    } finally {
      setLoading(false);
    }
  }, [resolveTeacher, teacherRow, fallbackTeacherId, fallbackTeacherName]);

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
    const studentName = String(r.student_name ?? r.studentName ?? "Lena Fischer");
    const subject = String(r.subject ?? "—");
    const city = String(r.city ?? "—");

    const normalized = {
      ...r,
      id: String(r.id),
      studentId: String(r.student_id ?? r.studentId ?? "s1"),
      teacherId: String(r.teacher_id ?? r.teacherId ?? (teacherRow?.id ?? fallbackTeacherId)),
      studentName: String(r.student_name ?? r.studentName ?? "Lena Fischer"),
      teacherName: String(r.teacher_name ?? r.teacherName ?? (teacherRow?.name ?? fallbackTeacherName)),
      status: String(r.status ?? "pending"),
      subject: String(r.subject ?? "—"),
      city: String(r.city ?? "—"),
      when: String(r.when ?? "so bald wie möglich"),
    };

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{studentName}</Text>
        <Text style={styles.sub}>
          {subject} • {city}
        </Text>

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
                const { chatId } = await acceptRequest(normalized);
                await load();
                navigation.navigate("ChatDetail", { chatId });
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
        </View>
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

  btn: {
    marginTop: 14,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "800" },
});

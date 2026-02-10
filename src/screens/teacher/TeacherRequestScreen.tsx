// src/screens/TeacherRequestScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function TeacherRequestScreen({ navigation }: any) {
  const { user } = useAuth();
  const { requests, acceptRequest, rejectRequest } = useAppData();

  const teacherId = String(user?.id ?? "t1");
  const [refreshing, setRefreshing] = useState(false);

  const pendingOnly = useMemo(() => {
    return (requests ?? []).filter(
      (r) => String(r.teacherId) === teacherId && (r.status ?? "pending") === "pending"
    );
  }, [requests, teacherId]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 250);
  };

  const renderItem = ({ item: r }: any) => {
    const studentName = String(r.studentName ?? "Schüler");
    const subject = String(r.subject ?? "—");
    const city = String(r.city ?? "—");

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
                await rejectRequest(r);
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
                const { chatId } = await acceptRequest(r);

                // ✅ Defensive Navigation: ChatDetail kann jetzt chatId ODER chat nehmen
                if (navigation?.navigate) {
                  navigation.navigate("ChatDetail", { chatId, chat: null });
                }
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

  if (pendingOnly.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Anfragen</Text>
        <Text style={styles.title}>Keine Anfragen</Text>
        <Text style={styles.sub}>Für dich ist gerade nichts offen.</Text>
        <TouchableOpacity style={styles.btn} onPress={onRefresh}>
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

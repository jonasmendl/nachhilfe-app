import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { conciergeListRequestsForStudent } from "../api/api";

const STUDENT_ID_KEY = "tutorswipe.studentId";

function mkId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

async function getOrCreateStudentId() {
  const existing = await AsyncStorage.getItem(STUDENT_ID_KEY);
  if (existing) return existing;
  const id = mkId("stu");
  await AsyncStorage.setItem(STUDENT_ID_KEY, id);
  return id;
}

function statusLabel(status: string) {
  switch (String(status)) {
    case "pending":
      return "Wartet auf Antwort";
    case "accepted":
      return "Angenommen ✅";
    case "declined":
      return "Abgelehnt";
    case "cancelled":
      return "Storniert";
    default:
      return String(status || "");
  }
}

function buildContactUrl(contact: string, message?: string) {
  const c = (contact || "").trim();

  if (!c) return null;

  if (c.startsWith("wa:")) {
    const phone = c.replace("wa:", "").replace(/\s+/g, "");
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${phone.replace("+", "")}${text}`;
  }

  if (c.startsWith("tel:")) return c;

  if (c.startsWith("mailto:")) {
    const email = c.replace("mailto:", "");
    const subject = "TutorSwipe Anfrage";
    const body = message ?? "";
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  // Fallbacks
  if (c.includes("@")) return `mailto:${c}`;
  if (c.startsWith("+") || /^\d+$/.test(c.replace(/\s+/g, ""))) {
    const phone = c.replace(/\s+/g, "");
    return `tel:${phone.startsWith("+") ? phone : `+${phone}`}`;
  }

  return null;
}

async function openContact(contact: string, prefilledMsg: string) {
  const url = buildContactUrl(contact, prefilledMsg);
  if (!url) {
    Alert.alert("Kontakt fehlt", "Der Lehrer hat keinen gültigen Kontakt eingetragen.");
    return;
  }
  const can = await Linking.canOpenURL(url);
  if (!can) {
    Alert.alert("Kann Link nicht öffnen", url);
    return;
  }
  await Linking.openURL(url);
}

type RequestRow = {
  requestId?: string;
  id?: string; // demo fallback
  status?: string;
  subject?: string;
  grade?: string;
  availability?: string;
  studentMessage?: string;

  teacherId?: string;
  teacherName?: string;
  teacherContact?: string;

  createdAt?: string | number;
  updatedAt?: string | number;
};

export default function StudentRequestsScreen() {
  const [studentId, setStudentId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string>("");

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      const ta = Number(new Date((a.updatedAt ?? a.createdAt) as any));
      const tb = Number(new Date((b.updatedAt ?? b.createdAt) as any));
      return (tb || 0) - (ta || 0);
    });
    return arr;
  }, [items]);

  const load = useCallback(async () => {
    try {
      setError("");
      const sid = studentId || (await getOrCreateStudentId());
      if (!studentId) setStudentId(sid);

      const data = await conciergeListRequestsForStudent(sid);
      const list = (data?.items ?? []) as RequestRow[];
      setItems(list);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [studentId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await load();
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, opacity: 0.7 }}>Lade Anfragen…</Text>
      </View>
    );
  }

  if (error && !sorted.length) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8 }}>Fehler</Text>
        <Text style={{ opacity: 0.8, marginBottom: 12 }}>{error}</Text>
        <Pressable
          onPress={load}
          style={{
            padding: 12,
            borderRadius: 10,
            backgroundColor: "#000",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={sorted}
        keyExtractor={(r, idx) => String(r.requestId || r.id || idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ paddingTop: 60, alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>Noch keine Anfragen</Text>
            <Text style={{ marginTop: 8, opacity: 0.7, textAlign: "center" }}>
              Swipe einen Tutor und sende eine Anfrage – dann erscheint sie hier.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = String(item.status || "pending");
          const teacherName = item.teacherName || "Tutor";
          const teacherContact = item.teacherContact || "";

          const prefilled = `Hi ${teacherName}, ich habe über TutorSwipe eine Anfrage gestellt. Mein Thema: ${item.subject || ""}. Passt dir diese Woche?`;

          return (
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.08)",
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>{teacherName}</Text>
                <Text style={{ opacity: 0.7 }}>{statusLabel(status)}</Text>
              </View>

              <Text style={{ marginTop: 6, opacity: 0.8 }}>
                Fach: {item.subject || "—"} {item.grade ? `• Klasse: ${item.grade}` : ""}
              </Text>

              {!!item.studentMessage && (
                <Text style={{ marginTop: 6, opacity: 0.8 }} numberOfLines={3}>
                  "{item.studentMessage}"
                </Text>
              )}

              {status === "accepted" ? (
                <Pressable
                  onPress={() => openContact(teacherContact, prefilled)}
                  style={{
                    marginTop: 12,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#000",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Kontakt aufnehmen</Text>
                </Pressable>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ opacity: 0.6 }}>
                    Sobald der Tutor annimmt, kannst du hier direkt Kontakt aufnehmen.
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

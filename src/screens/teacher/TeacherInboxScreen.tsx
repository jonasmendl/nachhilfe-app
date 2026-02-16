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
import { useAuth } from "../context/AuthContext";
import {
  conciergeListRequestsForTeacher,
  conciergeSetRequestStatus,
} from "../api/api";

function statusLabel(status: string) {
  switch (String(status)) {
    case "pending":
      return "Neu";
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
    Alert.alert("Kontakt fehlt", "Der Schüler hat keinen gültigen Kontakt eingetragen.");
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

  studentName?: string;
  studentContact?: string;
  studentMessage?: string;

  subject?: string;
  grade?: string;
  availability?: string;

  teacherId?: string;
  teacherName?: string;
  teacherContact?: string;

  createdAt?: string | number;
  updatedAt?: string | number;
};

export default function TeacherInboxScreen() {
  const { user } = useAuth();

  // ⚠️ HIER ggf. anpassen:
  // wenn bei dir teacherId anders heißt: user?.teacherId → user?.id oder user?.teacher?.teacherId etc.
  const teacherId = user?.id;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string>("");
  const [busyId, setBusyId] = useState<string>("");

  const sorted = useMemo(() => {
    const arr = [...items];
    // pending first, then updatedAt desc
    arr.sort((a, b) => {
      const sa = String(a.status || "pending");
      const sb = String(b.status || "pending");
      if (sa === "pending" && sb !== "pending") return -1;
      if (sb === "pending" && sa !== "pending") return 1;

      const ta = Number(new Date((a.updatedAt ?? a.createdAt) as any));
      const tb = Number(new Date((b.updatedAt ?? b.createdAt) as any));
      return (tb || 0) - (ta || 0);
    });
    return arr;
  }, [items]);

  const load = useCallback(async () => {
    try {
      setError("");
      if (!teacherId) throw new Error("teacherId fehlt im user context.");

      const data = await conciergeListRequestsForTeacher(teacherId);
      setItems((data?.items ?? []) as RequestRow[]);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

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

  const setStatus = useCallback(
    async (requestId: string, status: "accepted" | "declined") => {
      try {
        setBusyId(requestId);
        await conciergeSetRequestStatus(requestId, status);
        // optimistic refresh local
        setItems((prev) =>
          prev.map((r) =>
            String(r.requestId || r.id) === String(requestId)
              ? { ...r, status, updatedAt: new Date().toISOString() }
              : r
          )
        );
      } catch (e: any) {
        Alert.alert("Fehler", String(e?.message || e));
      } finally {
        setBusyId("");
      }
    },
    []
  );

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
            <Text style={{ fontSize: 16, fontWeight: "600" }}>Keine Anfragen</Text>
            <Text style={{ marginTop: 8, opacity: 0.7, textAlign: "center" }}>
              Sobald Schüler Anfragen senden, erscheinen sie hier.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const requestId = String(item.requestId || item.id || "");
          const status = String(item.status || "pending");
          const studentName = item.studentName || "Schüler";
          const studentContact = item.studentContact || "";

          const prefilled = `Hi ${studentName}, ich habe deine TutorSwipe-Anfrage gesehen. Wann passt es dir?`;

          const isBusy = busyId === requestId;

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
                <Text style={{ fontSize: 16, fontWeight: "700" }}>{studentName}</Text>
                <Text style={{ opacity: 0.7 }}>{statusLabel(status)}</Text>
              </View>

              <Text style={{ marginTop: 6, opacity: 0.8 }}>
                Fach: {item.subject || "—"} {item.grade ? `• Klasse: ${item.grade}` : ""}
              </Text>

              {!!item.availability && (
                <Text style={{ marginTop: 6, opacity: 0.8 }}>Verfügbarkeit: {item.availability}</Text>
              )}

              {!!item.studentMessage && (
                <Text style={{ marginTop: 8, opacity: 0.85 }} numberOfLines={4}>
                  "{item.studentMessage}"
                </Text>
              )}

              {status === "pending" ? (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                  <Pressable
                    disabled={isBusy}
                    onPress={() => setStatus(requestId, "declined")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: "rgba(0,0,0,0.06)",
                      alignItems: "center",
                      opacity: isBusy ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ fontWeight: "700" }}>Ablehnen</Text>
                  </Pressable>

                  <Pressable
                    disabled={isBusy}
                    onPress={() => setStatus(requestId, "accepted")}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: "#000",
                      alignItems: "center",
                      opacity: isBusy ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      {isBusy ? "…" : "Annehmen"}
                    </Text>
                  </Pressable>
                </View>
              ) : status === "accepted" ? (
                <Pressable
                  onPress={() => openContact(studentContact, prefilled)}
                  style={{
                    marginTop: 12,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#000",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Schüler kontaktieren</Text>
                </Pressable>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ opacity: 0.6 }}>Keine Aktion nötig.</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

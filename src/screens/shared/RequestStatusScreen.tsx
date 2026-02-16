import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator, Alert } from "react-native";
import { conciergeFetchStatus } from "../api/api";

const TERMINAL = new Set(["ABGELEHNT", "VERBUNDEN"]);

export default function RequestStatusScreen({ route, navigation }: any) {
  const { requestId, teacherName } = route.params;

  const [status, setStatus] = useState<string>("NEU");
  const [threadLink, setThreadLink] = useState<string>("");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const intervalRef = useRef<any>(null);

  async function refreshOnce() {
    try {
      setError("");
      const res = await conciergeFetchStatus(String(requestId));
      if (res?.error) throw new Error(res.error);

      setStatus(String(res?.status || "NEU"));
      setThreadLink(String(res?.threadLink || ""));
      setUpdatedAt(String(res?.updatedAt || ""));
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshOnce();

    intervalRef.current = setInterval(() => {
      void refreshOnce();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    if (TERMINAL.has(status) && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [status]);

  const openLink = async () => {
    if (!threadLink) return;
    const ok = await Linking.canOpenURL(threadLink);
    if (!ok) {
      Alert.alert("Link kann nicht geöffnet werden", threadLink);
      return;
    }
    Linking.openURL(threadLink);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Anfrage Status</Text>
      <Text style={styles.muted}>Tutor: {teacherName || "—"}</Text>
      <Text style={styles.muted}>RequestId: {requestId}</Text>
      {!!updatedAt && <Text style={styles.muted}>Updated: {updatedAt}</Text>}

      <View style={styles.card}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Lade Status…</Text>
          </View>
        ) : (
          <>
            <Text style={styles.status}>Status: {status}</Text>
            {!!error && <Text style={styles.error}>Fehler: {error}</Text>}

            {status === "VERBUNDEN" && !!threadLink && (
              <TouchableOpacity style={[styles.btn, styles.primary]} onPress={openLink}>
                <Text style={styles.btnTextPrimary}>Kontakt öffnen</Text>
              </TouchableOpacity>
            )}

            {!TERMINAL.has(status) && (
              <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => refreshOnce()}>
                <Text style={styles.btnTextSecondary}>Aktualisieren</Text>
              </TouchableOpacity>
            )}

            {status === "ABGELEHNT" && (
              <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => navigation.goBack()}>
                <Text style={styles.btnTextSecondary}>Zurück</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "900" },
  muted: { marginTop: 6, opacity: 0.6 },
  card: { marginTop: 16, borderWidth: 1, borderColor: "#ddd", borderRadius: 16, padding: 16 },
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  status: { fontSize: 18, fontWeight: "900" },
  error: { marginTop: 10, color: "#b00020" },
  btn: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: "center" },
  primary: { backgroundColor: "#007AFF" },
  secondary: { backgroundColor: "#eee" },
  btnTextPrimary: { color: "white", fontWeight: "900" },
  btnTextSecondary: { fontWeight: "900" },
}); 

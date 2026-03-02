// src/screens/student/StudentMatchesScreen.tsx
import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Linking, Alert, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function StudentMatchesScreen() {
  const { user } = useAuth();
  const { requests, refreshStudentMatches } = useAppData();

  useEffect(() => {
    if (user?.id) refreshStudentMatches(user.id);
  }, [user?.id]);

  const accepted = requests.filter(r => r.status === "accepted");
  const pending = requests.filter(r => r.status === "pending");

  const openContact = async (contact: string) => {
    if (!contact) { Alert.alert("Kein Kontakt", "Lehrer hat keinen Kontakt angegeben."); return; }
    let url = contact;
    if (contact.includes("@")) url = `mailto:${contact}`;
    else if (contact.startsWith("+") || /^\d/.test(contact)) url = `https://wa.me/${contact.replace(/\D/g, "")}`;
    const can = await Linking.canOpenURL(url);
    if (can) Linking.openURL(url);
    else Alert.alert("Kontakt", contact);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Meine Anfragen</Text>

      {accepted.length > 0 && (
        <>
          <Text style={styles.section}>✅ Angenommen</Text>
          {accepted.map(r => (
            <View key={r.id} style={[styles.card, { borderColor: "#4CAF50" }]}>
              <Text style={styles.name}>{r.teacherName}</Text>
              <Text style={styles.sub}>{r.subject} • {r.city}</Text>
              <TouchableOpacity style={styles.btn} onPress={() => openContact(r.contact ?? "")}>
                <Text style={styles.btnText}>Kontakt aufnehmen</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {pending.length > 0 && (
        <>
          <Text style={styles.section}>⏳ Ausstehend</Text>
          {pending.map(r => (
            <View key={r.id} style={styles.card}>
              <Text style={styles.name}>{r.teacherName}</Text>
              <Text style={styles.sub}>{r.subject} • {r.city}</Text>
              <Text style={styles.waiting}>Wartet auf Antwort…</Text>
            </View>
          ))}
        </>
      )}

      {requests.length === 0 && (
        <Text style={styles.empty}>Noch keine Anfragen. Swipe einen Lehrer!</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "900", marginBottom: 12 },
  section: { fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  card: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 16, padding: 14, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "800" },
  sub: { opacity: 0.6, marginTop: 4 },
  waiting: { marginTop: 8, opacity: 0.5, fontStyle: "italic" },
  btn: { marginTop: 10, backgroundColor: "#000", padding: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
  empty: { marginTop: 40, textAlign: "center", opacity: 0.5 },
});
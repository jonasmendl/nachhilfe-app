// src/screens/student/StudentMatchesScreen.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Linking, Alert, StyleSheet, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function StudentMatchesScreen() {
  const { user } = useAuth();
  const { requests, refreshStudentMatches } = useAppData();

  useEffect(() => {
    if (user?.id) refreshStudentMatches(user.id);
  }, [user?.id]);

  const realRequests = requests.filter(r => {
    const hasTeacherId = r.teacherId && r.teacherId.trim() !== "" && r.teacherId !== "undefined";
    const isNotGhost = r.teacherName !== "Lehrer" || r.subject !== ""; 
    return hasTeacherId && isNotGhost;
  });

  const accepted = realRequests.filter(r => r.status === "accepted");
  const pending = realRequests.filter(r => r.status === "pending");

  // 🔥 NEU: Der verbesserte, fehlertolerante Kontakt-Button
  const openContact = async (contact: string | undefined, teacherName: string) => {
    const safeContact = contact?.trim() || "";
    
    console.log(`Versuche Kontakt zu öffnen für ${teacherName}:`, safeContact);

    if (!safeContact) { 
      Alert.alert("Kein Kontakt", `${teacherName} hat leider keine Kontaktdaten hinterlegt.`); 
      return; 
    }
    
    try {
      // 1. Prüfen, ob es eine E-Mail ist
      if (safeContact.includes("@")) {
        const mailUrl = `mailto:${safeContact}`;
        const canOpen = await Linking.canOpenURL(mailUrl);
        if (canOpen) {
          await Linking.openURL(mailUrl);
          return;
        }
      } 

      // 2. Prüfen, ob es eine Telefonnummer ist (Zahlen, Leerzeichen, Plus, Minus)
      const isPhone = /^[+0-9\s-]+$/.test(safeContact);
      if (isPhone) {
        const phoneUrl = `https://wa.me/${safeContact.replace(/\D/g, "")}`;
        const canOpen = await Linking.canOpenURL(phoneUrl);
        if (canOpen) {
          await Linking.openURL(phoneUrl);
          return;
        }
      }

      // 3. FALLBACK: Weder E-Mail noch Telefon, oder App konnte nicht geöffnet werden
      // Zeigt einfach ein Popup an, damit der User den Text zumindest ablesen/kopieren kann!
      Alert.alert(
        `Kontakt von ${teacherName}`,
        safeContact,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Fehler beim Öffnen des Kontakts:", error);
      Alert.alert(`Kontakt von ${teacherName}`, safeContact);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Meine Anfragen</Text>

      {accepted.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.section}>✅ Angenommen</Text>
          {accepted.map((r, index) => (
            <View key={`accepted-${r.requestId || r.teacherId}-${index}`} style={[styles.card, { borderColor: "#4CAF50" }]}>
              <Text style={styles.name}>{r.teacherName}</Text>
              <Text style={styles.sub}>{r.subject} • {r.city}</Text>
              <TouchableOpacity 
                style={styles.btn} 
                onPress={() => openContact(r.contact, r.teacherName)}
              >
                <Text style={styles.btnText}>Kontakt aufnehmen</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {pending.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.section}>⏳ Ausstehend</Text>
          {pending.map((r, index) => (
            <View key={`pending-${r.requestId || r.teacherId}-${index}`} style={styles.card}>
              <Text style={styles.name}>{r.teacherName}</Text>
              <Text style={styles.sub}>{r.subject} • {r.city}</Text>
              <Text style={styles.waiting}>Wartet auf Antwort…</Text>
            </View>
          ))}
        </View>
      )}

      {realRequests.length === 0 && (
        <Text style={styles.empty}>Noch keine Anfragen. Swipe einen Lehrer!</Text>
      )}
    </ScrollView>
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
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getTeacherStatus } from "../api/api";
import { useNavigation } from "@react-navigation/native";
// 🔥 NEU: Wir holen den Logout-Befehl direkt von Clerk
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";

export default function TeacherWaitingRoomScreen() {
  const { user } = useAuth();
  const { signOut } = useClerkAuth(); // 🔥 HIER IST DER FIX
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<any>();

  const checkMyStatus = async () => {
    setLoading(true);
    try {
      const status = await getTeacherStatus(user?.id || "");
      console.log("🔍 SERVER ANTWORT:", JSON.stringify(status)); 

      const data = Array.isArray(status) ? status[0] : status;
      const isVerified = String(data?.verified).trim().toUpperCase() === "TRUE";

      if (isVerified) {
        Alert.alert("Erfolg 🎉", "Dein Profil wurde freigeschaltet!", [
          { text: "Los geht's", onPress: () => navigation.replace("MainTabs") } 
        ]);
      } else {
        Alert.alert("Noch in Prüfung", "Dein Profil wurde noch nicht freigeschaltet. Bitte habe noch etwas Geduld.");
      }
    } catch (error) {
      console.error("Fehler beim Check:", error);
      Alert.alert("Fehler", "Status konnte nicht geprüft werden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Profil wird geprüft</Text>
      <Text style={styles.text}>
        Vielen Dank für deine Registrierung! Unser Team prüft aktuell deinen Identitätsnachweis. 
      </Text>
      <Text style={styles.text}>
        Sobald alles passt, wirst du freigeschaltet und kannst direkt loslegen.
      </Text>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: "#007BFF", marginBottom: 15 }]} 
        onPress={checkMyStatus}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Status jetzt prüfen</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>Ausloggen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 30, justifyContent: "center", alignItems: "center" },
  icon: { fontSize: 80, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 15, textAlign: "center", color: "#333" },
  text: { fontSize: 16, textAlign: "center", marginBottom: 15, color: "#666", lineHeight: 24 },
  button: { backgroundColor: "#ff3b30", padding: 15, borderRadius: 10, width: "100%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
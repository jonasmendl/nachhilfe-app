// src/screens/TeacherWaitingRoomScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function TeacherWaitingRoomScreen() {
  const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⏳</Text>
      <Text style={styles.title}>Profil wird geprüft</Text>
      <Text style={styles.text}>
        Vielen Dank für deine Registrierung! Unser Team prüft aktuell deinen Identitätsnachweis. 
      </Text>
      <Text style={styles.text}>
        Sobald alles passt, wirst du freigeschaltet und kannst direkt loslegen. Bitte habe etwas Geduld!
      </Text>

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
  button: { backgroundColor: "#ff3b30", padding: 15, borderRadius: 10, width: "100%", alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
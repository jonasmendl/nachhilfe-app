import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";

const GAS_URL = (process.env.EXPO_PUBLIC_GAS_URL || "").trim();

export default function TeacherLoginScreen() {
  const { setUser } = useAuth();

  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const c = contact.trim();

    if (!GAS_URL) {
      Alert.alert("Fehler", "EXPO_PUBLIC_GAS_URL fehlt in deiner .env");
      return;
    }

    if (!c) {
      Alert.alert("Kontakt fehlt", "Bitte gib deinen Kontakt ein (wa:/tel:/mailto:...).");
      return;
    }

    try {
      setLoading(true);

      const url = `${GAS_URL}?path=/teacher/login&contact=${encodeURIComponent(c)}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Alert.alert("Login Fehler", JSON.stringify(data));
        return;
      }

      const item = data?.item;

      const teacherId = String(item?.teacherId || "").trim();
      if (!teacherId) {
        Alert.alert(
          "Nicht gefunden",
          "Kein Teacher mit diesem Kontakt. (Tipp: exakt gleich wie im teachers Sheet.)"
        );
        return;
      }

      // Persistenter Login: user.id = teacherId
      await setUser({
        id: teacherId,
        name: String(item?.name || "Teacher"),
        email: c, // wir speichern contact hier rein (MVP)
        role: "Teacher",
        teacherProfile: {
          subjects: String(item?.subject || "")
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean),
          hourlyRate: Number(item?.pricePerHour || 0),
          city: String(item?.city || ""),
          bio: String(item?.bio || ""),
        },
      });

      // Danach wechselt die App automatisch in Teacher Tabs (Inbox), weil user.role=Teacher + user.id gesetzt
    } catch (e: any) {
      Alert.alert("Login Fehler", String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6 }}>
        Teacher Login
      </Text>

      <Text style={{ opacity: 0.7, marginBottom: 12 }}>
        Gib denselben Kontakt ein, den du bei der Registrierung gespeichert hast.
      </Text>

      <TextInput
        placeholder="z.B. wa:+491701234567 oder mailto:max@domain.de"
        value={contact}
        onChangeText={setContact}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.15)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      />

      <Pressable
        onPress={login}
        disabled={loading}
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "800" }}>Einloggen</Text>
        )}
      </Pressable>

      <Text style={{ marginTop: 14, fontSize: 12, opacity: 0.6 }}>
        Hinweis: contact muss im teachers Sheet exakt gleich gespeichert sein.
      </Text>
    </View>
  );
}

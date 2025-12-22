import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "./context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherProfileSetup">;

export default function TeacherProfileSetupScreen({ navigation, route }: Props) {
  const { updateTeacherProfile } = useAuth();
  const { name, email } = route.params;

  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  const handleSave = () => {
    if (!subjects.trim() || !hourlyRate.trim() || !city.trim()) {
      Alert.alert("Fehlt noch was", "Bitte Fächer, Preis und Ort ausfüllen.");
      return;
    }

    updateTeacherProfile({
      subjects: subjects.split(",").map((s) => s.trim()).filter(Boolean),
      hourlyRate: Number(hourlyRate),
      city: city.trim(),
      bio: bio.trim(),
    });

    navigation.replace("MainTabs");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Lehrerprofil einrichten</Text>

      <Text style={styles.small}>Name: {name}</Text>
      <Text style={styles.small}>E-Mail: {email}</Text>

      <TextInput
        style={styles.input}
        placeholder="Fächer (z.B. Mathe, Englisch)"
        value={subjects}
        onChangeText={setSubjects}
      />

      <TextInput
        style={styles.input}
        placeholder="Preis pro Stunde (z.B. 25)"
        value={hourlyRate}
        onChangeText={setHourlyRate}
        keyboardType="numeric"
      />

      <TextInput style={styles.input} placeholder="Ort / Stadt" value={city} onChangeText={setCity} />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Kurz-Bio (optional)"
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Profil speichern</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  small: { textAlign: "center", marginBottom: 6, color: "#555" },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

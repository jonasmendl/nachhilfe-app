import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "./context/AuthContext";
import { upsertTeacher } from "./api/api";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherProfileSetup">;

export default function TeacherProfileSetupScreen({ navigation, route }: Props) {
  const { user, updateTeacherProfile } = useAuth();

  const safeName = route?.params?.name ?? user?.name ?? "";
  const safeEmail = route?.params?.email ?? user?.email ?? "";

  const authUid = String(user?.id ?? (user as any)?.uid ?? "");

  const initial = useMemo(() => {
    const tp = user?.teacherProfile;
    return {
      subjects: tp?.subjects?.length ? tp.subjects.join(", ") : "",
      hourlyRate: tp?.hourlyRate ? String(tp.hourlyRate) : "",
      city: tp?.city ?? "",
      bio: tp?.bio ?? "",
    };
  }, [user]);

  const [subjects, setSubjects] = useState(initial.subjects);
  const [hourlyRate, setHourlyRate] = useState(initial.hourlyRate);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);

  const handleSave = async () => {
    if (!authUid) {
      Alert.alert("Fehler", "Kein User gefunden. Bitte nochmal starten.");
      return;
    }

    const rate = Number(hourlyRate);
    if (!subjects.trim() || !hourlyRate.trim() || !city.trim() || Number.isNaN(rate) || rate <= 0) {
      Alert.alert("Fehlt noch was", "Bitte Fächer, Preis (Zahl) und Ort ausfüllen.");
      return;
    }

    const subjectList = subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await upsertTeacher({
        authUid,
        name: safeName || "Teacher",
        subject: subjectList.join(", "),
        city: city.trim(),
        bio: bio.trim() || null,
        pricePerHour: rate,
        email: safeEmail || undefined,
      } as any);

      updateTeacherProfile({
        subjects: subjectList,
        hourlyRate: rate,
        city: city.trim(),
        bio: bio.trim() || undefined,
      });

      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate("SignUp" as any);
    } catch (e: any) {
      Alert.alert("Fehler", String(e?.message || e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Lehrerprofil einrichten</Text>

      <Text style={styles.small}>Name: {safeName || "-"}</Text>
      <Text style={styles.small}>E-Mail: {safeEmail || "-"}</Text>

      <TextInput
        style={styles.input}
        placeholder="Fächer (z.B. Mathe, Englisch)"
        value={subjects}
        onChangeText={setSubjects}
        autoCapitalize="sentences"
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

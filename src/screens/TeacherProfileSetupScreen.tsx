import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "./context/AuthContext";
import { upsertTeacher } from "./api/api";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherProfileSetup">;

// Simple stable id (MVP). If you already have auth uid, we use it.
// Otherwise fallback to email. Otherwise timestamp-based.
function makeTeacherId(authUid: string, email: string) {
  const a = String(authUid || "").trim();
  if (a) return a;

  const e = String(email || "").trim().toLowerCase();
  if (e) return `email_${e}`;

  return `teacher_${Date.now()}`;
}

export default function TeacherProfileSetupScreen({ navigation, route }: Props) {
  const { user, updateTeacherProfile } = useAuth();

  const safeName = route?.params?.name ?? user?.name ?? "";
  const safeEmail = route?.params?.email ?? user?.email ?? "";

  // Keep authUid as optional source of stable teacherId
  const authUid = String(user?.id ?? (user as any)?.uid ?? "").trim();
  const teacherId = makeTeacherId(authUid, safeEmail);

  const initial = useMemo(() => {
    const tp = user?.teacherProfile;
    return {
      subjects: tp?.subjects?.length ? tp.subjects.join(", ") : "",
      hourlyRate: tp?.hourlyRate ? String(tp.hourlyRate) : "",
      city: tp?.city ?? "",
      bio: tp?.bio ?? "",
      contact: safeEmail ?? "",
    };
  }, [user, safeEmail]);

  const [subjects, setSubjects] = useState(initial.subjects);
  const [hourlyRate, setHourlyRate] = useState(initial.hourlyRate);
  const [city, setCity] = useState(initial.city);
  const [bio, setBio] = useState(initial.bio);
  const [contact, setContact] = useState(initial.contact);

  const handleSave = async () => {
    const rate = Number(hourlyRate);

    if (!subjects.trim() || !hourlyRate.trim() || !city.trim() || Number.isNaN(rate) || rate <= 0) {
      Alert.alert("Fehlt noch was", "Bitte Fächer, Preis (Zahl) und Ort ausfüllen.");
      return;
    }

    const subjectList = subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!subjectList.length) {
      Alert.alert("Fehlt noch was", "Bitte mindestens ein Fach eingeben.");
      return;
    }

    // contact is optional in your sheet, but it's super useful
    const contactValue = String(contact || safeEmail || "").trim();
    if (!contactValue) {
      Alert.alert("Fehlt noch was", "Bitte eine Kontaktmöglichkeit angeben (E-Mail/WhatsApp).");
      return;
    }

    try {
      // SHEETS MODE payload:
      // teacherId, name, subject, city, bio, pricePerHour, contact
      await upsertTeacher({
        teacherId, // IMPORTANT: this maps to sheet "teacherId"
        name: safeName || "Teacher",
        subject: subjectList.join(", "),
        city: city.trim(),
        bio: bio.trim() || "",
        pricePerHour: rate,
        contact: contactValue,
      } as any);

      // local app state update (optional)
      updateTeacherProfile({
        subjects: subjectList,
        hourlyRate: rate,
        city: city.trim(),
        bio: bio.trim() || undefined,
      });

      // navigation
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" as never }],
        });
      }
    } catch (e: any) {
      Alert.alert("Fehler", String(e?.message || e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Lehrerprofil einrichten</Text>

      <Text style={styles.small}>Name: {safeName || "-"}</Text>
      <Text style={styles.small}>TeacherId: {teacherId}</Text>

      <TextInput
        style={styles.input}
        placeholder="Kontakt (E-Mail oder WhatsApp)"
        value={contact}
        onChangeText={setContact}
        autoCapitalize="none"
        keyboardType="email-address"
      />

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

import React, { useMemo, useState } from "react";
import { Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as DocumentPicker from "expo-document-picker"; 
import { RootStackParamList } from "../../App";
import { useAuth } from "./context/AuthContext";
import { upsertTeacher } from "./api/api";

type Props = NativeStackScreenProps<RootStackParamList, "TeacherProfileSetup">;

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

  const [dokumentUri, setDokumentUri] = useState<string | null>(null);
  const [dokumentName, setDokumentName] = useState<string | null>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"], 
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDokumentUri(result.assets[0].uri);
        setDokumentName(result.assets[0].name);
      }
    } catch (err) {
      console.log("Fehler beim Dokument-Upload:", err);
      Alert.alert("Fehler", "Das Dokument konnte nicht geladen werden.");
    }
  };

  const handleSave = async () => {
    const rate = Number(hourlyRate);

    if (!subjects.trim() || !hourlyRate.trim() || !city.trim() || Number.isNaN(rate) || rate <= 0) {
      Alert.alert("Fehlt noch was", "Bitte Fächer, Preis (Zahl) und Ort ausfüllen.");
      return;
    }

    const subjectList = subjects.split(",").map((s) => s.trim()).filter(Boolean);
    if (!subjectList.length) {
      Alert.alert("Fehlt noch was", "Bitte mindestens ein Fach eingeben.");
      return;
    }

    const contactValue = String(contact || safeEmail || "").trim();
    if (!contactValue) {
      Alert.alert("Fehlt noch was", "Bitte eine Kontaktmöglichkeit angeben (E-Mail/WhatsApp).");
      return;
    }

    if (!dokumentUri) {
      Alert.alert(
        "Verifizierung fehlt", 
        "Bitte lade deine Immatrikulationsbescheinigung oder einen Ausweis hoch."
      );
      return;
    }

    try {
      // ✅ ÜBERGABE AN API: Wir senden die Daten UND die dokumentUri
      await upsertTeacher({
        teacherId,
        name: safeName || "Teacher",
        subject: subjectList.join(", "),
        city: city.trim(),
        bio: bio.trim() || "",
        pricePerHour: rate,
        contact: contactValue,
      }, dokumentUri); 

      updateTeacherProfile({
        subjects: subjectList,
        hourlyRate: rate,
        city: city.trim(),
        bio: bio.trim() || undefined,
      });

      navigation.reset({ index: 0, routes: [{ name: "TeacherWaitingRoom" as never }] });
      
    } catch (e: any) {
      Alert.alert("Fehler", String(e?.message || e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Lehrerprofil einrichten</Text>
      
      <View style={styles.uploadSection}>
        <Text style={styles.uploadTitle}>Identitätsnachweis (Pflicht)</Text>
        <Text style={styles.uploadSub}>Bitte lade deine Immatrikulationsbescheinigung oder Ausweis hoch (PDF/Foto).</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
          <Text style={styles.uploadButtonText}>
            {dokumentName ? `✅ ${dokumentName}` : "📄 Datei auswählen"}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Kontakt (E-Mail oder WhatsApp)" value={contact} onChangeText={setContact} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Fächer (z.B. Mathe, Englisch)" value={subjects} onChangeText={setSubjects} />
      <TextInput style={styles.input} placeholder="Preis pro Stunde" value={hourlyRate} onChangeText={setHourlyRate} keyboardType="numeric" />
      <TextInput style={styles.input} placeholder="Ort / Stadt" value={city} onChangeText={setCity} />
      <TextInput style={[styles.input, styles.textArea]} placeholder="Kurz-Bio" value={bio} onChangeText={setBio} multiline />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.buttonText}>Profil speichern</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  uploadSection: { backgroundColor: "#f0f8ff", padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: "#b0d4ff" },
  uploadTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5, color: "#004085" },
  uploadSub: { fontSize: 12, color: "#555", marginBottom: 10 },
  uploadButton: { backgroundColor: "#007BFF", padding: 12, borderRadius: 8, alignItems: "center" },
  uploadButtonText: { color: "#fff", fontWeight: "bold" },
  saveButton: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
import React, { useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const { user, updateTeacherProfile, updateStudentPrefs, setUser } = useAuth();

  const isTeacher = user?.role === "Teacher";
  const isStudent = user?.role === "Student";

  const initialTeacher = useMemo(() => {
    return user?.teacherProfile ?? { subjects: [], hourlyRate: "", city: "", bio: "" };
  }, [user]);

  const initialStudent = useMemo(() => {
    return user?.studentPrefs ?? { subjects: ["Mathe"], city: "Berlin", availabilityMinutesFromNow: 45 };
  }, [user]);

  // Teacher editable
  const [tSubjects, setTSubjects] = useState(initialTeacher.subjects.join(", "));
  const [tRate, setTRate] = useState(String(initialTeacher.hourlyRate));
  const [tCity, setTCity] = useState(initialTeacher.city);
  const [tBio, setTBio] = useState(initialTeacher.bio ?? "");

  // Student prefs editable
  const [sSubjects, setSSubjects] = useState(initialStudent.subjects.join(", "));
  const [sCity, setSCity] = useState(initialStudent.city);
  const [sTime, setSTime] = useState(String(initialStudent.availabilityMinutesFromNow));

  const save = () => {
    if (!user) return;

    if (isTeacher) {
      if (!tSubjects.trim() || !tCity.trim() || !tRate.trim()) {
        Alert.alert("Fehler", "Bitte Fächer, Ort und Preis ausfüllen.");
        return;
      }
      updateTeacherProfile({
        subjects: tSubjects.split(",").map((s) => s.trim()).filter(Boolean),
        hourlyRate: Number(tRate),
        city: tCity.trim(),
        bio: tBio.trim(),
      });
      Alert.alert("Gespeichert", "Lehrerprofil aktualisiert.");
      return;
    }

    if (isStudent) {
      if (!sSubjects.trim() || !sCity.trim() || !sTime.trim()) {
        Alert.alert("Fehler", "Bitte Fächer, Ort und Zeit ausfüllen.");
        return;
      }
      updateStudentPrefs({
        subjects: sSubjects.split(",").map((s) => s.trim()).filter(Boolean),
        city: sCity.trim(),
        availabilityMinutesFromNow: Number(sTime),
      });
      Alert.alert("Gespeichert", "Schüler-Einstellungen aktualisiert.");
    }
  };

  const logout = () => {
    setUser(null);
    Alert.alert("Logout", "App neu starten oder zurück navigieren (später machen wir Auto-Redirect).");
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "800", marginBottom: 10 }}>Profil</Text>

      <Text style={{ fontWeight: "700" }}>Name: {user?.name}</Text>
      <Text>E-Mail: {user?.email}</Text>
      <Text>Rolle: {user?.role}</Text>

      {isTeacher && (
        <>
          <Text style={{ marginTop: 16, fontWeight: "800" }}>Lehrerprofil</Text>

          <Text style={{ marginTop: 10 }}>Fächer (Komma getrennt)</Text>
          <TextInput value={tSubjects} onChangeText={setTSubjects} style={fieldStyle} />

          <Text style={{ marginTop: 10 }}>Preis pro Stunde</Text>
          <TextInput value={tRate} onChangeText={setTRate} keyboardType="numeric" style={fieldStyle} />

          <Text style={{ marginTop: 10 }}>Ort / Stadt</Text>
          <TextInput value={tCity} onChangeText={setTCity} style={fieldStyle} />

          <Text style={{ marginTop: 10 }}>Bio</Text>
          <TextInput value={tBio} onChangeText={setTBio} multiline style={[fieldStyle, { minHeight: 90 }]} />
        </>
      )}

      {isStudent && (
        <>
          <Text style={{ marginTop: 16, fontWeight: "800" }}>Schüler-Einstellungen</Text>

          <Text style={{ marginTop: 10 }}>Fächer (Komma getrennt)</Text>
          <TextInput value={sSubjects} onChangeText={setSSubjects} style={fieldStyle} />

          <Text style={{ marginTop: 10 }}>Ort / Stadt</Text>
          <TextInput value={sCity} onChangeText={setSCity} style={fieldStyle} />

          <Text style={{ marginTop: 10 }}>Spontan verfügbar in (Minuten)</Text>
          <TextInput value={sTime} onChangeText={setSTime} keyboardType="numeric" style={fieldStyle} />
        </>
      )}

      <TouchableOpacity
        onPress={save}
        style={{ marginTop: 18, padding: 14, backgroundColor: "#007AFF", borderRadius: 12 }}
      >
        <Text style={{ color: "white", textAlign: "center", fontWeight: "800" }}>Speichern</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={logout}
        style={{ marginTop: 12, padding: 14, backgroundColor: "#eee", borderRadius: 12 }}
      >
        <Text style={{ textAlign: "center", fontWeight: "800" }}>Logout (Demo)</Text>
      </TouchableOpacity>
    </View>
  );
}

const fieldStyle = {
  borderWidth: 1,
  borderColor: "#aaa",
  borderRadius: 10,
  padding: 12,
  marginTop: 6,
};

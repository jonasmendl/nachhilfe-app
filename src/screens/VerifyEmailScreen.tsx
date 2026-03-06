// src/screens/VerifyEmailScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, navigationRef } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "VerifyEmail">;

export default function VerifyEmailScreen({ route, navigation }: Props) {
  const { isLoaded, signUp, setActive } = useSignUp();
  // ✅ FIX: Wir holen uns hier die Rolle aus den Parametern!
  const { email, role } = route.params;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!isLoaded) return;

    if (code.length !== 6) {
      Alert.alert("Fehler", "Bitte gib den 6-stelligen Code aus deiner E-Mail ein.");
      return;
    }

    setLoading(true);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        // Loggt den User ein. Clerk wechselt im Hintergrund den Navigator!
        await setActive({ session: completeSignUp.createdSessionId });
        
        // ✅ FIX: Wir leiten Lehrer in den Setup-Screen um (mit minimaler Verzögerung für den Navigator-Wechsel)
        if (role === "Teacher") {
          const name = completeSignUp.unsafeMetadata?.fullName as string;
          
          setTimeout(() => {
            if (navigationRef.isReady()) {
              navigationRef.navigate("TeacherProfileSetup", {
                teacherId: completeSignUp.createdUserId || "",
                name: name || "",
                email: email,
                role: "Teacher",
              });
            }
          }, 500); // Eine halbe Sekunde warten, bis AppNavigator aktiv ist
        }
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Fehler", err.errors?.[0]?.message || "Falscher Code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>E-Mail bestätigen</Text>
      <Text style={styles.text}>
        Wir haben einen Code an **{email}** gesendet. Bitte gib ihn hier ein:
      </Text>

      <TextInput
        style={styles.input}
        placeholder="6-stelliger Code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verifizieren</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: "#007AFF" }}>Abbrechen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  text: { fontSize: 16, textAlign: "center", marginBottom: 30, color: "#555" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    width: "80%",
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 5,
    marginBottom: 20,
  },
  button: { backgroundColor: "#4CAF50", padding: 15, borderRadius: 10, width: "80%", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
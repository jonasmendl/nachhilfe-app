// src/screens/SignUpScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

export default function SignUpScreen({ navigation, route }: Props) {
  const { isLoaded, signUp } = useSignUp();
  const role = route.params.role;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    
    const n = name.trim();
    const e = email.trim();

    if (!n || !e || password.length < 8) {
      Alert.alert("Fehler", "Bitte Name, E-Mail und ein Passwort (min. 8 Zeichen) eingeben.");
      return;
    }

    setLoading(true);

    try {
      await signUp.create({
        emailAddress: e,
        password,
        unsafeMetadata: {
          fullName: n,
          role: role
        }
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // ✅ FIX: Wir geben die Rolle jetzt mit an den VerifyEmailScreen!
      navigation.navigate("VerifyEmail", { email: e, role: role });
      
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Registrierung fehlgeschlagen", err.errors?.[0]?.message || "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrieren</Text>
      <Text style={styles.roleText}>Konto erstellen als: **{role}**</Text>

      <TextInput 
        style={styles.input} 
        placeholder="Vollständiger Name" 
        value={name} 
        onChangeText={setName} 
      />

      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Code anfordern</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => navigation.goBack()} 
        style={{ marginTop: 20 }}
      >
        <Text style={{ color: "#007AFF", textAlign: "center" }}>Zurück zur Rollenauswahl</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  roleText: { textAlign: "center", marginBottom: 20, color: "#555" },
  input: { borderWidth: 1, borderColor: "#aaa", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
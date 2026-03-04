import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

export default function TeacherLoginScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!isLoaded) return;

    if (!email.trim() || !password) {
      Alert.alert("Fehler", "Bitte E-Mail und Passwort eingeben.");
      return;
    }

    try {
      setLoading(true);

      // 1. Logge den User mit Clerk ein
      const completeSignIn = await signIn.create({
        identifier: email.trim(),
        password,
      });

      // 2. Setze die Session aktiv, AuthContext erkennt das automatisch!
      if (completeSignIn.status === "complete") {
        await setActive({ session: completeSignIn.createdSessionId });
        // Danach wechselt die App automatisch in die MainTabs, 
        // weil user im AuthContext nicht mehr null ist.
      } else {
        console.log(JSON.stringify(completeSignIn, null, 2));
        Alert.alert("Login nicht vollständig", "Bitte versuche es erneut.");
      }
    } catch (err: any) {
      console.error("Login Fehler:", JSON.stringify(err, null, 2));
      Alert.alert(
        "Login fehlgeschlagen",
        err.errors?.[0]?.message || "E-Mail oder Passwort ist falsch."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 6 }}>
        Login
      </Text>

      <Text style={{ opacity: 0.7, marginBottom: 12 }}>
        Melde dich mit deiner E-Mail und deinem Passwort an.
      </Text>

      <TextInput
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        style={fieldStyle}
      />

      <TextInput
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={fieldStyle}
      />

      <Pressable
        onPress={login}
        disabled={loading}
        style={{
          height: 48,
          borderRadius: 12,
          backgroundColor: "#007AFF",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 10,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Einloggen</Text>
        )}
      </Pressable>
    </View>
  );
}

const fieldStyle = {
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.15)",
  borderRadius: 12,
  padding: 12,
  marginBottom: 12,
  fontSize: 16,
};
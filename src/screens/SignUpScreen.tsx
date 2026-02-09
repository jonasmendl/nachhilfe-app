import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "./context/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

export default function SignUpScreen({ navigation, route }: Props) {
  const { setUser } = useAuth();
  const role = route.params.role;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSignUp = () => {
    const n = name.trim();
    const e = email.trim();

    if (!n || !e) {
      Alert.alert("Fehler", "Bitte Name und E-Mail eingeben");
      return;
    }

    // ✅ User setzen
    setUser({
      id: role === "Teacher" ? "t1" : "s1",
      name: n,
      email: e,
      role,
    });

    // ✅ Teacher: direkt Setup Screen (Auth-Flow)
    if (role === "Teacher") {
      navigation.navigate("TeacherProfileSetup", {
        name: n,
        email: e,
        role: "Teacher",
      });
      return;
    }

    // ✅ Student: keine Navigation nötig (Root switched automatisch)
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.roleText}>Rolle: {role}</Text>

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />

      <TextInput
        style={styles.input}
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Weiter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  roleText: { textAlign: "center", marginBottom: 20, color: "#555" },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});

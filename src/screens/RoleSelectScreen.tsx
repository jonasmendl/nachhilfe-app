import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "RoleSelect">;

export default function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Neu hier?</Text>

      <Button
        title="Als Schüler registrieren"
        onPress={() => navigation.navigate("SignUp", { role: "Student" })}
      />
      <View style={styles.spacer} />
      <Button
        title="Als Lehrer registrieren"
        onPress={() => navigation.navigate("SignUp", { role: "Teacher" })}
      />

      <View style={styles.divider} />

      <Text style={styles.title}>Schon einen Account?</Text>
      <Button
        title="Hier Einloggen"
        color="#007AFF"
        // WICHTIG: Falls deine Route in der App.tsx noch "TeacherLogin" heißt, 
        // benutze hier "TeacherLogin". Langfristig solltest du sie in "Login" umbenennen!
        onPress={() => navigation.navigate("TeacherLogin" as any)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 20, marginBottom: 20, fontWeight: "600" },
  spacer: { height: 12 },
  divider: { height: 1, backgroundColor: "#ccc", width: "80%", marginVertical: 40 },
});
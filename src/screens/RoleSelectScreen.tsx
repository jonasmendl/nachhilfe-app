import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "RoleSelect"
>;

export default function RoleSelectScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your role</Text>

      <Button
        title="I am a Student"
        onPress={() =>
          navigation.navigate("SignUp", { role: "Student" })
        }
      />

      <View style={styles.spacer} />

      <Button
        title="I am a Teacher"
        onPress={() =>
          navigation.navigate("SignUp", { role: "Teacher" })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 24,
    fontWeight: "600",
  },
  spacer: {
    height: 12,
  },
});

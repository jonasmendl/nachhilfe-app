import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function RoleSelectScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your role</Text>

      <Button
        title="I am a Student"
        onPress={() => navigation.navigate('SignUp', { role: 'Student' })}
      />

      <Button
        title="I am a Teacher"
        onPress={() => navigation.navigate('SignUp', { role: 'Teacher' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});

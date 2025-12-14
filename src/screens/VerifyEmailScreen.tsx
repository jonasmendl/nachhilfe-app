import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function VerifyEmailScreen({ route, navigation }: any) {
  const { email } = route.params;

  const handleVerified = () => {
    navigation.navigate('Role'); // simulierter Rückweg
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Wir haben einen Bestätigungscode an {email} gesendet.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleVerified}>
        <Text style={styles.buttonText}>Ich habe verifiziert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 18, textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, width: '60%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18 },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

export default function ChatDetailScreen({ route }: Props) {
  const { chat } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat Detail</Text>
      <Text style={styles.subtitle}>{chat?.title ?? 'Conversation'}</Text>
      {!!chat?.lastMessage && <Text style={styles.message}>{chat.lastMessage}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#444',
  },
});

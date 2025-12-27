import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const API_URL = 'http://localhost:4000';
const TEACHER_ID = 'teacher-1';

type RequestEntry = {
  id: number;
  parentId: number;
  studentId: string;
  teacherId?: string;
  message: string;
  status: string;
  createdAt: string;
};

export default function TeacherRequestScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/requests?teacherId=${TEACHER_ID}`);
      if (!response.ok) {
        throw new Error('Request failed');
      }
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError('Konnte Requests nicht laden.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAccept = (entry: RequestEntry) => {
    navigation.navigate('ChatDetail', {
      chat: {
        id: `chat-${entry.id}`,
        title: `Request ${entry.id}`,
        lastMessage: entry.message,
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teacher Requests</Text>
      <Text style={styles.description}>Alle Requests für den festen Demo-Teacher.</Text>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={requests.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={<Text style={styles.description}>Keine Requests vorhanden.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Request #{item.id}</Text>
              <Text style={styles.cardText}>{item.message}</Text>
              <Text style={styles.meta}>Student: {item.studentId}</Text>
              <Text style={styles.meta}>Status: {item.status}</Text>
              <TouchableOpacity style={styles.button} onPress={() => handleAccept(item)}>
                <Text style={styles.buttonText}>Accept → Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: '#444',
  },
  error: {
    fontSize: 16,
    color: 'red',
  },
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

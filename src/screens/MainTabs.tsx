import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import TeacherRequestScreen from './TeacherRequestScreen';

function ProfileScreen() {
  return (
    <View style={styles.center}>
      <Text>Profile Screen</Text>
    </View>
  );
}

function MatchesScreen() {
  return (
    <View style={styles.center}>
      <Text>Matches Screen</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: string = '';

          if (route.name === 'Profile') iconName = 'person-circle';
          else if (route.name === 'Matches') iconName = 'heart';
          else if (route.name === 'Chat') iconName = 'chatbubbles';

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Chat" component={TeacherRequestScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

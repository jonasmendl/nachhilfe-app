// src/screens/MainTabs.tsx
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useUser } from "@clerk/clerk-expo"; // Direkt Clerk nutzen!

import StudentSwipeScreen from "./student/StudentSwipeScreen";
import StudentMatchesScreen from "./student/StudentMatchesScreen";
import TeacherRequestScreen from "./teacher/TeacherRequestScreen";
import ProfileScreen from "./shared/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  // Wir holen den User jetzt direkt von Clerk
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Rolle aus Clerk-Metadaten auslesen
  const role = user?.unsafeMetadata?.role || user?.publicMetadata?.role;

  return (
    <Tab.Navigator>
      {role === "Student" ? (
        <>
          <Tab.Screen name="Swipen" component={StudentSwipeScreen} />
          <Tab.Screen name="Matches" component={StudentMatchesScreen} />
          <Tab.Screen name="Profil" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Anfragen" component={TeacherRequestScreen} />
          <Tab.Screen name="Profil" component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}
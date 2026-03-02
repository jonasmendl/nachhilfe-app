import React from "react";
import { ActivityIndicator, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "./context/AuthContext";
import StudentSwipeScreen from "./student/StudentSwipeScreen";
import StudentMatchesScreen from "./student/StudentMatchesScreen";
import TeacherRequestScreen from "./teacher/TeacherRequestScreen";
import ProfileScreen from "./shared/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { user } = useAuth();

  if (!user?.role) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Tab.Navigator>
      {user.role === "Student" ? (
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
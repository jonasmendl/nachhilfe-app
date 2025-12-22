import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "./context/AuthContext";

import StudentSwipeScreen from "./student/StudentSwipeScreen";
import TeacherRequestScreen from "./teacher/TeacherRequestScreen"; // ✅ EINZAHL + richtiger Pfad
import ChatsScreen from "./shared/ChatsScreen";
import ProfileScreen from "./shared/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { user } = useAuth();

  if (!user?.role) return null;

  return (
    <Tab.Navigator>
      {user.role === "Student" ? (
        <>
          <Tab.Screen name="Chats" component={ChatsScreen} />
          <Tab.Screen name="Swipen" component={StudentSwipeScreen} />
          <Tab.Screen name="Profil" component={ProfileScreen} />
        </>
      ) : (
        <>
          <Tab.Screen name="Anfragen" component={TeacherRequestScreen} />
          <Tab.Screen name="Chats" component={ChatsScreen} />
          <Tab.Screen name="Profil" component={ProfileScreen} />
        </>
      )}
    </Tab.Navigator>
  );
}

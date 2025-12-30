import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChatDetailScreen from "./src/screens/shared/ChatDetailScreen";
import RoleSelectScreen from "./src/screens/RoleSelectScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MainTabs from "./src/screens/MainTabs";
import TeacherProfileSetupScreen from "./src/screens/TeacherProfileSetupScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";

import { AuthProvider } from "./src/screens/context/AuthContext";
import { AppDataProvider } from "./src/screens/context/AppDataContext";

import { getHealth } from "./src/screens/api/api"; // 👈 NEU
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();


export type RootStackParamList = {
  RoleSelect: undefined;
  SignUp: { role: "Student" | "Teacher" };
  TeacherProfileSetup: { name: string; email: string; role: "Teacher" };
  VerifyEmail: { email: string };
  MainTabs: undefined;
  ChatDetail: { chat: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // 👇 NEU: Backend-Test
  useEffect(() => {
    getHealth()
      .then((data) => {
        console.log("✅ Backend OK:", data);
      })
      .catch((err) => {
        console.error("❌ Backend ERROR:", err);
      });
  }, []);

  return (
    <AuthProvider>
      <AppDataProvider>
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator initialRouteName="RoleSelect">
            <Stack.Screen
              name="RoleSelect"
              component={RoleSelectScreen}
              options={{ title: "Choose Role" }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: "Sign Up" }}
            />
            <Stack.Screen
              name="TeacherProfileSetup"
              component={TeacherProfileSetupScreen}
              options={{ title: "Teacher Setup" }}
            />
            <Stack.Screen
              name="VerifyEmail"
              component={VerifyEmailScreen}
              options={{ title: "Verify Email" }}
            />
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChatDetail"
              component={ChatDetailScreen}
              options={{ title: "Chat" }}
              initialParams={{ chat: null }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AppDataProvider>
    </AuthProvider>
  );
}

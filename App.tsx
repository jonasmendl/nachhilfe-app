// App.tsx
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNavigationContainerRef } from "@react-navigation/native";

import ChatDetailScreen from "./src/screens/shared/ChatDetailScreen";
import RoleSelectScreen from "./src/screens/RoleSelectScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MainTabs from "./src/screens/MainTabs";
import TeacherProfileSetupScreen from "./src/screens/TeacherProfileSetupScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";

import { AuthProvider, useAuth } from "./src/screens/context/AuthContext";
import { AppDataProvider } from "./src/screens/context/AppDataContext";

import { getHealth } from "./src/screens/api/api";

export type RootStackParamList = {
  RoleSelect: undefined;
  SignUp: { role: "Student" | "Teacher" };
  TeacherProfileSetup: { name: string; email: string; role: "Teacher" };
  VerifyEmail: { email: string };
  MainTabs: undefined;
  // ✅ akzeptiert jetzt beides (TeacherRequest navigiert mit chatId)
  ChatDetail: { chat?: any | null; chatId?: string | null };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const AuthStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="RoleSelect">
      <AuthStack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Choose Role" }} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Sign Up" }} />
      <AuthStack.Screen
        name="TeacherProfileSetup"
        component={TeacherProfileSetupScreen}
        options={{ title: "Teacher Setup" }}
      />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Verify Email" }} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator initialRouteName="MainTabs">
      <AppStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ title: "Chat" }}
        initialParams={{ chat: null, chatId: null }}
      />
    </AppStack.Navigator>
  );
}

function Root() {
  const { user } = useAuth();

  useEffect(() => {
    getHealth().then(() => {}).catch(() => {});
  }, []);

  const needsTeacherSetup = !!user && user.role === "Teacher" && !user.teacherProfile;

  return (
    <NavigationContainer ref={navigationRef}>
      {!user || needsTeacherSetup ? <AuthNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <Root />
      </AppDataProvider>
    </AuthProvider>
  );
}

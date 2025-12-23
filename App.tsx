import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import RoleSelectScreen from "./src/screens/RoleSelectScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MainTabs from "./src/screens/MainTabs";
import TeacherProfileSetupScreen from "./src/screens/TeacherProfileSetupScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";

import { AuthProvider } from "./src/screens/context/AuthContext";
import { AppDataProvider } from "./src/screens/context/AppDataContext"; // ✅ neu

export type RootStackParamList = {
  RoleSelect: undefined;
  SignUp: { role: "Student" | "Teacher" };
  TeacherProfileSetup: { name: string; email: string; role: "Teacher" };
  VerifyEmail: { email: string };
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="RoleSelect">
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Choose Role" }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Sign Up" }} />
            <Stack.Screen
              name="TeacherProfileSetup"
              component={TeacherProfileSetupScreen}
              options={{ title: "Teacher Setup" }}
            />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Verify Email" }} />
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppDataProvider>
    </AuthProvider>
  );
}

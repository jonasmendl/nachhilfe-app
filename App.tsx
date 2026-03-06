// App.tsx
import React, { useState, useEffect } from "react";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/screens/context/AuthContext";
import { AppDataProvider } from "./src/screens/context/AppDataContext";

// API
import { getTeacherStatus } from "./src/screens/api/api";

// Screens
import ChatDetailScreen from "./src/screens/shared/ChatDetailScreen";
import RoleSelectScreen from "./src/screens/RoleSelectScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MainTabs from "./src/screens/MainTabs";
import TeacherProfileSetupScreen from "./src/screens/TeacherProfileSetupScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";
import TeacherLoginScreen from "./src/screens/teacher/TeacherLoginScreen";
import TeacherWaitingRoomScreen from "./src/screens/teacher/TeacherWaitingRoomScreen";

// --- CLERK SETUP ---
const tokenCache = {
  async getToken(key: string) {
    try { return SecureStore.getItemAsync(key); } catch (err) { return null; }
  },
  async saveToken(key: string, value: string) {
    try { return SecureStore.setItemAsync(key, value); } catch (err) { return; }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// --- NAVIGATION TYPES ---
export type RootStackParamList = {
  RoleSelect: undefined;
  SignUp: { role: "Student" | "Teacher" };
  VerifyEmail: { email: string; role: "Student" | "Teacher" };
  MainTabs: undefined;
  ChatDetail: { chat?: any | null; chatId?: string | null };
  TeacherLogin: undefined; 
  TeacherProfileSetup: { teacherId: string; name: string; email: string; role: "Teacher" }; 
  TeacherWaitingRoom: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// --- NAVIGATORS ---

function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="RoleSelect">
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Willkommen" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Registrieren" }} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Code bestätigen" }} />
      <Stack.Screen name="TeacherLogin" component={TeacherLoginScreen} options={{ title: "Einloggen" }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user } = useAuth();
  // 🔥 NEU: 3 Zustände -> verifiziert (TRUE), warten (FALSE) oder Setup (noch nicht in Tabelle)
  const [status, setStatus] = useState<"verified" | "waiting" | "setup" | null>(null);

  useEffect(() => {
    async function checkVerification() {
      if (user?.role === "Teacher") {
        try {
          const res = await getTeacherStatus(user.id);
          
          // 🔥 HIER IST DER FIX: Der "kugelsichere" Check jetzt auch in der App.tsx
          const data = Array.isArray(res) ? res[0] : res;
          const verifiedString = String(data?.verified).trim().toUpperCase();

          if (verifiedString === "TRUE") {
            setStatus("verified");
          } else if (verifiedString === "FALSE") {
            setStatus("waiting");
          } else {
            console.log("Lehrer hat noch kein TRUE oder FALSE -> ab zum Setup!");
            setStatus("setup");
          }
        } catch (error) {
          console.log("Lehrer nicht im Sheet gefunden, starte Profil-Setup!");
          setStatus("setup");
        }
      } else {
        setStatus("verified"); // Schüler dürfen immer durch
      }
    }
    checkVerification();
  }, [user]);

  // Ladebildschirm während der Anfrage
  if (status === null && user?.role === "Teacher") return null;

  // 🔥 NEU: Die clevere Kreuzung entscheidet, wo der User startet
  let initialRoute: keyof RootStackParamList = "MainTabs";
  if (status === "waiting") initialRoute = "TeacherWaitingRoom";
  if (status === "setup") initialRoute = "TeacherProfileSetup";

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      
      <Stack.Screen 
        name="TeacherWaitingRoom" 
        component={TeacherWaitingRoomScreen} 
        options={{ title: "Wartezimmer", headerBackVisible: false, gestureEnabled: false }} 
      />
      
      {/* 🔥 Der Profil-Setup Screen ist jetzt wieder voll erreichbar */}
      <Stack.Screen 
        name="TeacherProfileSetup" 
        component={TeacherProfileSetupScreen} 
        initialParams={{
          teacherId: user?.id || "",
          name: user?.fullName || "",
          email: user?.primaryEmailAddress?.emailAddress || "",
          role: "Teacher"
        }}
        options={{ title: "Profil erstellen", headerBackVisible: false, gestureEnabled: false }} 
      />

      <Stack.Screen 
        name="ChatDetail" 
        component={ChatDetailScreen} 
        options={{ title: "Chat" }} 
        initialParams={{ chat: null, chatId: null }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppDataProvider>
            <NavigationContainer ref={navigationRef}>
              <SignedIn>
                <AppNavigator />
              </SignedIn>
              <SignedOut>
                <AuthNavigator />
              </SignedOut>
            </NavigationContainer>
          </AppDataProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createNavigationContainerRef } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/screens/context/AuthContext";
// Screens
import ChatDetailScreen from "./src/screens/shared/ChatDetailScreen";
import RoleSelectScreen from "./src/screens/RoleSelectScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import MainTabs from "./src/screens/MainTabs";
import TeacherProfileSetupScreen from "./src/screens/TeacherProfileSetupScreen";
import VerifyEmailScreen from "./src/screens/VerifyEmailScreen";

// Context & API
import { AppDataProvider } from "./src/screens/context/AppDataContext";

// --- CLERK SETUP ---
const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// --- NAVIGATION SETUP ---
export type RootStackParamList = {
  RoleSelect: undefined;
  SignUp: { role: "Student" | "Teacher" };
  TeacherProfileSetup: { teacherId: string; name: string; email: string; role: "Teacher" };
  VerifyEmail: { email: string };
  MainTabs: undefined;
  ChatDetail: { chat?: any | null; chatId?: string | null };
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Diese Navigation wird angezeigt, wenn man NICHT eingeloggt ist
function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="RoleSelect">
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} options={{ title: "Willkommen" }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: "Registrieren" }} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Code bestätigen" }} />
      {/* TeacherProfileSetup bleibt im Auth-Flow, falls das Profil noch fehlt */}
      <Stack.Screen name="TeacherProfileSetup" component={TeacherProfileSetupScreen} options={{ title: "Profil erstellen" }} />
    </Stack.Navigator>
  );
}

// Diese Navigation wird angezeigt, wenn man EINGELOGGT ist
function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="MainTabs">
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
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
            
            {/* Clerk prüft automatisch den Login-Status */}
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
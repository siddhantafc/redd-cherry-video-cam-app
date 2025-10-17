import React from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/auth/login/LoginScreen";
import SignupScreen from "./screens/auth/signup/SignupScreen";
import HostHome from "./screens/hosts/HostHome";
import HostChat from "./screens/hosts/HostChat/HostChat";
import HostMenu from "./screens/hosts/HostMenu/HostMenu";
import HostNotification from "./screens/hosts/HostNotification/HostNotification";
import HostImages from "./screens/hosts/HostMenu/HostImages/HostImages";
import HostVideos from "./screens/hosts/HostMenu/HostVideos/HostVideos";
import HostKycImages from "./screens/hosts/HostMenu/HostKycImages/HostKycImages";
import HostAuditionVideo from "./screens/hosts/HostMenu/HostAuditionVideo/HostAuditionVideo";
import HostBankDetails from "./screens/hosts/HostMenu/HostBankDetails/HostBankDetails";
import HostWithdraw from "./screens/hosts/HostMenu/HostWithdraw/HostWithdraw";
import HostWithdrawalHistory from "./screens/hosts/HostMenu/HostWithdrawalHistory/HostWithdrawalHistory";
import HostAppGuide from "./screens/hosts/HostMenu/HostAppGuide/HostAppGuide";
import HostReportIssue from "./screens/hosts/HostMenu/HostReportIssue/HostReportIssue";
import UserHome from "./screens/users/UserHome";
import UserMenu from "./screens/users/UserMenu/UserMenu";
import UserRecharge from "./screens/users/UserMenu/UserRecharge/UserRechange";
import UserRechargeHistory from "./screens/users/UserMenu/UserRechargeHistory/UserRechargeHistory";
import TermsAndConditions from "./screens/users/TermsAndConditions/TermsAndConditions";
import ReportIssue from "./screens/users/ReportIssue/ReportIssue";
import HostProfilePage from "./screens/users/HostProfile/HostProfilePage";
import Toast from "react-native-toast-message";
import VideoCallProvider from './components/VideoCallProvider';
import CallManager from './components/common/CallManager';
import WalletBalanceProvider from "./contexts/WalletBalanceContext";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import "../nativewind";

const Stack = createNativeStackNavigator();

// Separate stacks for clarity
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function HostStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HostHome" component={HostHome} />
      <Stack.Screen name="HostChat" component={HostChat} />
      <Stack.Screen name="HostMenu" component={HostMenu} />
      <Stack.Screen name="HostNotification" component={HostNotification} />
      <Stack.Screen name="HostImages" component={HostImages} />
      <Stack.Screen name="HostVideos" component={HostVideos} />
      <Stack.Screen name="HostKycImages" component={HostKycImages} />
      <Stack.Screen name="HostAuditionVideo" component={HostAuditionVideo} />
      <Stack.Screen name="HostBankDetails" component={HostBankDetails} />
      <Stack.Screen name="HostWithdraw" component={HostWithdraw} />
      <Stack.Screen name="HostWithdrawalHistory" component={HostWithdrawalHistory} />
      <Stack.Screen name="HostAppGuide" component={HostAppGuide} />
      <Stack.Screen name="HostReportIssue" component={HostReportIssue} />
      <Stack.Screen name="HostProfile" component={HostProfilePage} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
    </Stack.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserHome" component={UserHome} />
      <Stack.Screen name="UserMenu" component={UserMenu} />
      <Stack.Screen name="UserRecharge" component={UserRecharge} />
      <Stack.Screen name="UserRechargeHistory" component={UserRechargeHistory} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
      <Stack.Screen name="HostProfile" component={HostProfilePage} />
      <Stack.Screen name="ReportIssue" component={ReportIssue} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, roleId, authLoading } = useAuth();

  if (authLoading) {
    return null; // Could render a splash/loading screen here
  }

  if (!isAuthenticated) return <AuthStack />;
  if (roleId === '1') return <HostStack />;
  if (roleId === '2') return <UserStack />;
  // Default fallback
  return <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AuthProvider>
        <WalletBalanceProvider>
          <VideoCallProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
              <CallManager />
              <Toast />
            </NavigationContainer>
          </VideoCallProvider>
        </WalletBalanceProvider>
      </AuthProvider>
    </SafeAreaView>
  );
}

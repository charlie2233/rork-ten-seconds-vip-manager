import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SecurityProvider } from "@/contexts/SecurityContext";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import { CouponsProvider } from "@/contexts/CouponsContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isGuest, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isI18nLoading } = useI18n();
  const { isLoading: isSettingsLoading } = useSettings();
  const isLoading = isAuthLoading || isI18nLoading || isSettingsLoading;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      {isAuthenticated || isGuest ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      )}
      <Stack.Screen
        name="onboarding"
        options={{
          presentation: 'modal',
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      />
      <Stack.Screen 
        name="member-code" 
        options={{ 
          presentation: 'modal', 
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' } 
        }} 
      />
      <Stack.Screen name="recharge" options={{ headerShown: false }} />
      <Stack.Screen name="promo" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="security" options={{ headerShown: false }} />
      <Stack.Screen name="preferences" options={{ headerShown: false }} />
      <Stack.Screen name="how-it-works" options={{ headerShown: false }} />
      <Stack.Screen name="nearby-stores" options={{ headerShown: false }} />
      <Stack.Screen name="support-chat" options={{ headerShown: false }} />
      <Stack.Screen name="help-center" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <I18nProvider>
            <SettingsProvider>
              <SecurityProvider>
                <AuthProvider>
                  <CouponsProvider>
                    <NotificationsProvider>
                      <RootLayoutNav />
                    </NotificationsProvider>
                  </CouponsProvider>
                </AuthProvider>
              </SecurityProvider>
            </SettingsProvider>
          </I18nProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

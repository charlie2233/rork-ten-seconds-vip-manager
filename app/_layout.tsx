import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Colors from "@/constants/colors";
import { trpc, trpcClient } from "@/lib/trpc";
import { I18nProvider, useI18n } from "@/contexts/I18nContext";
import { CouponsProvider } from "@/contexts/CouponsContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isI18nLoading } = useI18n();
  const isLoading = isAuthLoading || isI18nLoading;

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
      {isAuthenticated ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      )}
      <Stack.Screen 
        name="member-code" 
        options={{ 
          presentation: 'modal', 
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' } 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <I18nProvider>
            <AuthProvider>
              <CouponsProvider>
                <RootLayoutNav />
              </CouponsProvider>
            </AuthProvider>
          </I18nProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

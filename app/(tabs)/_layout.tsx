import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, router } from "expo-router";
import { Home, Gift, Receipt, User } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useI18n } from "@/contexts/I18nContext";

const ONBOARDING_SEEN_KEY = 'onboarding_seen_v1';

export default function TabLayout() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const tabBarBottomPadding = Math.max(14, insets.bottom);
  const tabBarHeight = 74 + tabBarBottomPadding;
  const didCheckOnboardingRef = useRef(false);

  useEffect(() => {
    if (didCheckOnboardingRef.current) return;
    didCheckOnboardingRef.current = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        if (seen === '1') return;
        router.push('/onboarding');
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingTop: 10,
          paddingBottom: tabBarBottomPadding,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="benefits"
        options={{
          title: t("tabs.coupons"),
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t("tabs.transactions"),
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

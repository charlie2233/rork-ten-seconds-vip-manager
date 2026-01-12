import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useI18n } from "@/contexts/I18nContext";
import LanguageToggle from "@/components/LanguageToggle";

export default function NotFoundScreen() {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title"), headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.langToggle, { top: insets.top + 16 }]}>
          <LanguageToggle />
        </View>
        <Text style={styles.title}>{t("notFound.message")}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t("notFound.backHome")}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    padding: 20,
  },
  langToggle: {
    position: "absolute",
    left: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 16,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  linkText: {
    fontSize: 16,
    color: Colors.background,
    fontWeight: "500" as const,
  },
});

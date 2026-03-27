import { Link, Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { useI18n } from "@/contexts/I18nContext";
import TopBar from "@/components/TopBar";
import { useSettings } from "@/contexts/SettingsContext";

export default function NotFoundScreen() {
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title"), headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFill} />
        <TopBar title={t("notFound.title")} />
        <View style={styles.content}>
          <Text style={[styles.title, { fontSize: 20 * fontScale }]}>{t("notFound.message")}</Text>
          <Link href="/" style={styles.link} accessibilityRole="button">
            <Text style={[styles.linkText, { fontSize: 16 * fontScale }]}>{t("notFound.backHome")}</Text>
          </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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

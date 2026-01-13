import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Smartphone,
  Fingerprint,
  Eye,
  Shield,
  KeyRound,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import LanguageToggle from '@/components/LanguageToggle';
import Colors from '@/constants/colors';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  const handleChangePassword = () => {
    Alert.alert(t('security.changePassword'), t('security.changePasswordHint'));
  };

  const handleChangePaymentPassword = () => {
    Alert.alert(t('security.paymentPassword'), t('security.paymentPasswordHint'));
  };

  const handleViewDevices = () => {
    Alert.alert(t('security.linkedDevices'), t('security.linkedDevicesHint'));
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('security.title')}</Text>
        <LanguageToggle variant="icon" align="right" />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security.accountSection')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleChangePassword}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Lock size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{t('security.loginPassword')}</Text>
                  <Text style={styles.menuHint}>{t('security.loginPasswordHint')}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.lastItem]}
              onPress={handleChangePaymentPassword}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <KeyRound size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{t('security.paymentPassword')}</Text>
                  <Text style={styles.menuHint}>{t('security.paymentPasswordDesc')}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security.privacySection')}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Fingerprint size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{t('security.biometric')}</Text>
                  <Text style={styles.menuHint}>{t('security.biometricHint')}</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>

            <View style={[styles.toggleRow, styles.lastItem]}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Eye size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{t('security.hideBalance')}</Text>
                  <Text style={styles.menuHint}>{t('security.hideBalanceHint')}</Text>
                </View>
              </View>
              <Switch
                value={hideBalance}
                onValueChange={setHideBalance}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.text}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('security.devicesSection')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={[styles.menuItem, styles.lastItem]}
              onPress={handleViewDevices}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Smartphone size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{t('security.linkedDevices')}</Text>
                  <Text style={styles.menuHint}>{t('security.linkedDevicesDesc')}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.securityTip}>
          <Shield size={18} color={Colors.success} />
          <Text style={styles.securityTipText}>{t('security.tipText')}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  menuHint: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  securityTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  securityTipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.success,
    lineHeight: 18,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  Lock,
  Smartphone,
  Fingerprint,
  Eye,
  Shield,
  KeyRound,
  Trash2,
  Monitor,
  TabletSmartphone,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';
import { useSettings } from '@/contexts/SettingsContext';
import { useSecurity, Session } from '@/contexts/SecurityContext';
import TopBar from '@/components/TopBar';

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getDeviceIcon(platform: string) {
  if (platform === 'ios') return TabletSmartphone;
  if (platform === 'android') return Smartphone;
  return Monitor;
}

export default function SecurityScreen() {
  const { t } = useI18n();
  const { hideBalance, setHideBalance, backgroundGradient, biometricEnabled, setBiometricEnabled, fontScale } = useSettings();
  const { 
    sessions, 
    isLoadingSessions, 
    revokeSession, 
    revokeAllOtherSessions,
    getRemainingAttempts,
    maxAttempts,
    lockoutRemaining,
    isAccountLocked,
  } = useSecurity();

  const handleChangePassword = () => {
    Alert.alert(t('security.changePassword'), t('security.changePasswordHint'));
  };

  const handleChangePaymentPassword = () => {
    Alert.alert(t('security.paymentPassword'), t('security.paymentPasswordHint'));
  };

  const handleRevokeSession = (session: Session) => {
    if (session.isCurrent) {
      Alert.alert(
        t('security.cannotRevokeCurrent'),
        t('security.cannotRevokeCurrentDesc')
      );
      return;
    }

    Alert.alert(
      t('security.revokeSessionTitle'),
      t('security.revokeSessionMessage', { device: session.deviceName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.revoke'),
          style: 'destructive',
          onPress: () => revokeSession(session.id),
        },
      ]
    );
  };

  const handleRevokeAllOther = () => {
    const otherSessions = sessions.filter((s) => !s.isCurrent);
    if (otherSessions.length === 0) {
      Alert.alert(t('security.noOtherSessions'), t('security.noOtherSessionsDesc'));
      return;
    }

    Alert.alert(
      t('security.revokeAllTitle'),
      t('security.revokeAllMessage', { count: otherSessions.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('security.revokeAll'),
          style: 'destructive',
          onPress: () => revokeAllOtherSessions(),
        },
      ]
    );
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('security.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>{t('security.accountSection')}</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleChangePassword}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('security.changePassword')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Lock size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { fontSize: 15 * fontScale }]}>{t('security.loginPassword')}</Text>
                  <Text style={[styles.menuHint, { fontSize: 12 * fontScale }]}>{t('security.loginPasswordHint')}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.lastItem]}
              onPress={handleChangePaymentPassword}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('security.paymentPassword')}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <KeyRound size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { fontSize: 15 * fontScale }]}>{t('security.paymentPassword')}</Text>
                  <Text style={[styles.menuHint, { fontSize: 12 * fontScale }]}>{t('security.paymentPasswordDesc')}</Text>
                </View>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>{t('security.privacySection')}</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIcon}>
                  <Fingerprint size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={[styles.menuLabel, { fontSize: 15 * fontScale }]}>{t('security.biometric')}</Text>
                  <Text style={[styles.menuHint, { fontSize: 12 * fontScale }]}>{t('security.biometricHint')}</Text>
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
                  <Text style={[styles.menuLabel, { fontSize: 15 * fontScale }]}>{t('security.hideBalance')}</Text>
                  <Text style={[styles.menuHint, { fontSize: 12 * fontScale }]}>{t('security.hideBalanceHint')}</Text>
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
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>{t('security.devicesSection')}</Text>
            {otherSessions.length > 0 && (
              <TouchableOpacity
                style={styles.revokeAllButton}
                onPress={handleRevokeAllOther}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('security.revokeAll')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={[styles.revokeAllText, { fontSize: 13 * fontScale }]}>{t('security.revokeAll')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.card}>
            {isLoadingSessions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : sessions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { fontSize: 14 * fontScale }]}>{t('security.noSessions')}</Text>
              </View>
            ) : (
              <>
                {currentSession && (
                  <View style={[styles.sessionItem, otherSessions.length === 0 && styles.lastItem]}>
                    <View style={styles.sessionLeft}>
                      <View style={[styles.sessionIcon, styles.currentSessionIcon]}>
                        {React.createElement(getDeviceIcon(currentSession.platform), {
                          size: 20,
                          color: Colors.success,
                        })}
                      </View>
                      <View style={styles.sessionInfo}>
                        <View style={styles.sessionNameRow}>
                          <Text style={[styles.sessionName, { fontSize: 15 * fontScale }]}>{currentSession.deviceName}</Text>
                          <View style={styles.currentBadge}>
                            <Text style={[styles.currentBadgeText, { fontSize: 10 * fontScale }]}>{t('security.currentDevice')}</Text>
                          </View>
                        </View>
                        <Text style={[styles.sessionMeta, { fontSize: 12 * fontScale }]}>
                          {t('security.lastActive')}: {formatSessionDate(currentSession.lastActiveAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {otherSessions.map((session, index) => {
                  const DeviceIcon = getDeviceIcon(session.platform);
                  const isLast = index === otherSessions.length - 1;
                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={[styles.sessionItem, isLast && styles.lastItem]}
                      onPress={() => handleRevokeSession(session)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t('security.revokeSessionTitle')}
                    >
                      <View style={styles.sessionLeft}>
                        <View style={styles.sessionIcon}>
                          <DeviceIcon size={20} color={Colors.textSecondary} />
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={[styles.sessionName, { fontSize: 15 * fontScale }]}>{session.deviceName}</Text>
                          <Text style={[styles.sessionMeta, { fontSize: 12 * fontScale }]}>
                            {t('security.lastActive')}: {formatSessionDate(session.lastActiveAt)}
                          </Text>
                        </View>
                      </View>
                      <Trash2 size={18} color={Colors.error} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: 14 * fontScale }]}>{t('security.loginProtection')}</Text>
          <View style={styles.card}>
            <View style={[styles.protectionItem, styles.lastItem]}>
              <View style={styles.protectionInfo}>
                <Text style={[styles.protectionLabel, { fontSize: 15 * fontScale }]}>{t('security.bruteForceProtection')}</Text>
                <Text style={[styles.protectionDesc, { fontSize: 12 * fontScale }]}>
                  {isAccountLocked()
                    ? t('security.accountLockedFor', { minutes: Math.ceil(lockoutRemaining / 60) })
                    : t('security.attemptsRemaining', { 
                        current: getRemainingAttempts(), 
                        max: maxAttempts 
                      })}
                </Text>
              </View>
              <View style={[
                styles.protectionStatus,
                isAccountLocked() ? styles.protectionStatusLocked : styles.protectionStatusOk
              ]}>
                <Text style={[
                  styles.protectionStatusText,
                  { fontSize: 12 * fontScale },
                  isAccountLocked() ? styles.protectionStatusTextLocked : styles.protectionStatusTextOk
                ]}>
                  {isAccountLocked() ? t('security.locked') : t('security.active')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.securityTip}>
          <Shield size={18} color={Colors.success} />
          <Text style={[styles.securityTipText, { fontSize: 13 * fontScale, lineHeight: 18 * fontScale }]}>
            {t('security.tipText')}
          </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  revokeAllText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  revokeAllButton: {
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
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
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 163, 175, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  currentSessionIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  currentBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  sessionMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  protectionInfo: {
    flex: 1,
    marginRight: 12,
  },
  protectionLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  protectionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  protectionStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  protectionStatusOk: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  protectionStatusLocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  protectionStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  protectionStatusTextOk: {
    color: Colors.success,
  },
  protectionStatusTextLocked: {
    color: Colors.error,
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

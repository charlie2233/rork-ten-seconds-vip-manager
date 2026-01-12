import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Phone,
  CreditCard,
  Calendar,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  LogOut,
  Settings,
  MapPin,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { tierInfo } from '@/mocks/data';
import Colors from '@/constants/colors';

const menuSections = [
  {
    title: '账户设置',
    items: [
      { icon: Bell, label: '消息通知', value: '' },
      { icon: Shield, label: '账户安全', value: '' },
      { icon: Settings, label: '偏好设置', value: '' },
    ],
  },
  {
    title: '服务支持',
    items: [
      { icon: MapPin, label: '附近门店', value: '' },
      { icon: MessageSquare, label: '在线客服', value: '' },
      { icon: HelpCircle, label: '帮助中心', value: '' },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient
          colors={[Colors.background, Colors.backgroundLight]}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const tier = tierInfo[user.tier];

  const handleLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出当前账号吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>我的</Text>

        <View style={styles.profileCard}>
          <LinearGradient
            colors={[Colors.surface, Colors.surfaceLight]}
            style={styles.profileGradient}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {user.name.charAt(0)}
                </Text>
              </LinearGradient>
              <View style={[styles.tierBadge, { backgroundColor: tier.color }]}>
                <Text style={styles.tierBadgeText}>VIP</Text>
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={[styles.profileTier, { color: tier.color }]}>
                {tier.name}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <CreditCard size={18} color={Colors.primary} />
            </View>
            <Text style={styles.infoLabel}>会员ID</Text>
            <Text style={styles.infoValue}>{user.memberId}</Text>
          </View>
          
          <View style={styles.infoDivider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Phone size={18} color={Colors.primary} />
            </View>
            <Text style={styles.infoLabel}>手机号</Text>
            <Text style={styles.infoValue}>{user.phone}</Text>
          </View>
          
          <View style={styles.infoDivider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={18} color={Colors.primary} />
            </View>
            <Text style={styles.infoLabel}>入会日期</Text>
            <Text style={styles.infoValue}>{user.joinDate}</Text>
          </View>
        </View>

        {menuSections.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[
                      styles.menuItem,
                      index === section.items.length - 1 && styles.lastMenuItem,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuIcon}>
                      <IconComponent size={20} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                    <View style={styles.menuRight}>
                      {item.value && (
                        <Text style={styles.menuValue}>{item.value}</Text>
                      )}
                      <ChevronRight size={18} color={Colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <Text style={styles.version}>版本 1.0.0</Text>

        <View style={{ height: 100 }} />
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
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  profileCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatarGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  tierBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  profileTier: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 14,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
  },
});

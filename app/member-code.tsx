import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, RefreshCw, Copy, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';

// const CODE_SIZE = width * 0.6;

export default function MemberCodeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // If no user, we shouldn't really be here, but handle it gracefully
  if (!user) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.closeButtonOverlay} 
          onPress={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>请先登录</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Generate QR Code URL (using a public API for demo purposes since we can't use native packages)
  // In a real app with native code we would use react-native-qrcode-svg
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${user.memberId}&margin=10&color=000000&bgcolor=FFFFFF`;
  
  // Barcode URL (Code 128)
  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${user.memberId}&scale=3&height=10&incltext=false&backgroundcolor=FFFFFF&paddingwidth=10&paddingheight=10`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(user.memberId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <View style={styles.container}>
      {/* Background with blur effect simulation */}
      <View style={styles.backdrop} />
      
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Close button area - tapping outside could close */}
      <TouchableOpacity 
        style={styles.closeOverlay} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>会员码</Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => router.back()}
          >
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <LinearGradient
            colors={[Colors.surface, Colors.surfaceLight]}
            style={styles.cardGradient}
          >
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userTier}>
                  {user.tier === 'gold' ? '黄金会员' : 
                   user.tier === 'silver' ? '白银会员' : 
                   user.tier === 'platinum' ? '铂金会员' : '钻石会员'}
                </Text>
              </View>
            </View>

            <View style={styles.codeContainer}>
              <View style={styles.qrCodeWrapper}>
                <Image
                  key={`qr-${refreshKey}`}
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrCode}
                  contentFit="contain"
                  transition={200}
                />
              </View>

              <View style={styles.barcodeWrapper}>
                <Image
                  key={`bar-${refreshKey}`}
                  source={{ uri: barcodeUrl }}
                  style={styles.barcode}
                  contentFit="fill"
                  transition={200}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.memberIdRow}
              onPress={copyToClipboard}
              activeOpacity={0.7}
            >
              <Text style={styles.memberIdLabel}>会员卡号</Text>
              <View style={styles.memberIdValueContainer}>
                <Text style={styles.memberIdValue}>{user.memberId}</Text>
                {copied ? (
                  <Check size={16} color={Colors.success} style={styles.copyIcon} />
                ) : (
                  <Copy size={16} color={Colors.textMuted} style={styles.copyIcon} />
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.tipsContainer}>
              <Text style={styles.tipsText}>付款时请向收银员出示此码</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefresh}
              >
                <RefreshCw size={14} color={Colors.primary} />
                <Text style={styles.refreshText}>刷新</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.balanceCard}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>账户余额</Text>
            <Text style={styles.balanceValue}>¥{user.balance.toFixed(2)}</Text>
          </View>
          <View style={styles.balanceDivider} />
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>可用积分</Text>
            <Text style={[styles.balanceValue, { color: Colors.primary }]}>
              {user.points}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  closeOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40, 
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
  },
  cardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.background,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  userTier: {
    fontSize: 12,
    color: Colors.primary,
  },
  codeContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  qrCode: {
    width: '100%',
    height: '100%',
  },
  barcodeWrapper: {
    width: '100%',
    height: 60,
  },
  barcode: {
    width: '100%',
    height: '100%',
  },
  memberIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  memberIdLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  memberIdValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberIdValue: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.text,
    marginRight: 8,
    letterSpacing: 1,
  },
  copyIcon: {
    opacity: 0.7,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  tipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  tipsText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: Colors.primary,
  },
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceItem: {
    flex: 1,
    alignItems: 'center',
  },
  balanceDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  errorContainer: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  errorText: {
    color: Colors.text,
    marginBottom: 16,
  },
  closeButtonOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    padding: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.background,
    fontWeight: 'bold',
  },
});

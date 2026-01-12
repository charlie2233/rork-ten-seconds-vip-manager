import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Phone, Clock, Navigation, Star } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';

const MOCK_STORES = [
  {
    id: '1',
    nameKey: 'stores.store1.name',
    addressKey: 'stores.store1.address',
    phone: '021-88888888',
    hours: '10:00 - 22:00',
    distance: '0.5km',
    rating: 4.8,
    lat: 31.2304,
    lng: 121.4737,
  },
  {
    id: '2',
    nameKey: 'stores.store2.name',
    addressKey: 'stores.store2.address',
    phone: '021-66666666',
    hours: '10:00 - 21:30',
    distance: '1.2km',
    rating: 4.6,
    lat: 31.2354,
    lng: 121.4787,
  },
  {
    id: '3',
    nameKey: 'stores.store3.name',
    addressKey: 'stores.store3.address',
    phone: '021-55555555',
    hours: '11:00 - 22:00',
    distance: '2.8km',
    rating: 4.9,
    lat: 31.2404,
    lng: 121.4837,
  },
];

export default function NearbyStoresScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleNavigate = (lat: number, lng: number, name: string) => {
    const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
    const url = Platform.OS === 'ios'
      ? `${scheme}?q=${name}&ll=${lat},${lng}`
      : `${scheme}${lat},${lng}?q=${name}`;
    Linking.openURL(url);
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
        <Text style={styles.headerTitle}>{t('stores.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.locationBanner}>
          <MapPin size={18} color={Colors.primary} />
          <Text style={styles.locationText}>{t('stores.currentLocation')}</Text>
        </View>

        <View style={styles.storesList}>
          {MOCK_STORES.map((store) => (
            <View key={store.id} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                <View style={styles.storeNameRow}>
                  <Text style={styles.storeName}>{t(store.nameKey)}</Text>
                  <View style={styles.ratingBadge}>
                    <Star size={12} color={Colors.warning} fill={Colors.warning} />
                    <Text style={styles.ratingText}>{store.rating}</Text>
                  </View>
                </View>
                <Text style={styles.storeDistance}>{store.distance}</Text>
              </View>

              <View style={styles.storeInfo}>
                <View style={styles.infoRow}>
                  <MapPin size={14} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{t(store.addressKey)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Clock size={14} color={Colors.textMuted} />
                  <Text style={styles.infoText}>{store.hours}</Text>
                </View>
              </View>

              <View style={styles.storeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCall(store.phone)}
                  activeOpacity={0.7}
                >
                  <Phone size={18} color={Colors.primary} />
                  <Text style={styles.actionText}>{t('stores.call')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.navigateButton]}
                  onPress={() => handleNavigate(store.lat, store.lng, t(store.nameKey))}
                  activeOpacity={0.7}
                >
                  <Navigation size={18} color={Colors.background} />
                  <Text style={styles.navigateText}>{t('stores.navigate')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: Colors.primary,
  },
  storesList: {
    gap: 16,
  },
  storeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  storeDistance: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  storeInfo: {
    gap: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  storeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201, 169, 98, 0.12)',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  navigateButton: {
    backgroundColor: Colors.primary,
  },
  navigateText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.background,
  },
});

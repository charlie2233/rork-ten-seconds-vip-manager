import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { Clock, Globe, MapPin, Phone, ShoppingBag } from 'lucide-react-native';
import Colors from '@/constants/colors';
import TopBar from '@/components/TopBar';
import { useI18n } from '@/contexts/I18nContext';
import { storeLocations } from '@/mocks/data';
import { Weekday } from '@/types';
import { useSettings } from '@/contexts/SettingsContext';

const WEEKDAY_ORDER: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function toTelUrl(phone: string) {
  const digitsOnly = phone.replace(/\D/g, '');
  const normalized = digitsOnly.length === 10 ? `1${digitsOnly}` : digitsOnly;
  return `tel:+${normalized}`;
}

function mapUrlForAddress(address: string) {
  const encoded = encodeURIComponent(address);
  if (Platform.OS === 'ios') {
    return `https://maps.apple.com/?q=${encoded}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

export default function LocationsScreen() {
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();

  const location = storeLocations[0];
  if (!location) return null;

  const openMaps = async () => {
    await Linking.openURL(mapUrlForAddress(location.address));
  };

  const openWebsite = async () => {
    if (!location.website) return;
    await Linking.openURL(location.website);
  };

  const openOnlineOrder = async () => {
    if (!location.onlineOrderUrl) return;
    await Linking.openURL(location.onlineOrderUrl);
  };

  const callStore = async () => {
    if (!location.phone) return;
    await Linking.openURL(toTelUrl(location.phone));
  };

  const hoursByDay = new Map(location.hours.map((h) => [h.day, h.time]));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar title={t('locations.title')} leftAction="back" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.storeName, { fontSize: 18 * fontScale, lineHeight: 22 * fontScale }]}>
              {t(location.name)}
            </Text>
            <View style={styles.headerButtons}>
              {location.onlineOrderUrl ? (
                <TouchableOpacity
                  style={styles.orderButton}
                  onPress={openOnlineOrder}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t('locations.orderOnline')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ShoppingBag size={16} color={Colors.background} />
                  <Text style={[styles.orderButtonText, { fontSize: 12 * fontScale }]}>
                    {t('locations.orderOnline')}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.mapButton}
                onPress={openMaps}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t('locations.openInMaps')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MapPin size={16} color={Colors.background} />
                <Text style={[styles.mapButtonText, { fontSize: 12 * fontScale }]}>
                  {t('locations.openInMaps')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={18} color={Colors.primary} />
            <View style={styles.infoTextBlock}>
              <Text style={[styles.infoLabel, { fontSize: 12 * fontScale }]}>{t('locations.address')}</Text>
              <Text style={[styles.infoValue, { fontSize: 14 * fontScale }]}>{location.address}</Text>
              {location.place ? (
                <Text style={[styles.infoSubValue, { fontSize: 12 * fontScale }]}>
                  {t('locations.locatedAt', { place: location.place })}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Clock size={18} color={Colors.primary} />
            <View style={styles.infoTextBlock}>
              <Text style={[styles.infoLabel, { fontSize: 12 * fontScale }]}>{t('locations.hours')}</Text>
              <View style={styles.hoursTable}>
                {WEEKDAY_ORDER.map((day) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={[styles.hoursDay, { fontSize: 12 * fontScale }]}>{t(`weekday.${day}`)}</Text>
                    <Text style={[styles.hoursTime, { fontSize: 12 * fontScale }]}>{hoursByDay.get(day) ?? '--'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {(location.website || location.phone) ? <View style={styles.divider} /> : null}

          {location.website ? (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={openWebsite}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('locations.website')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Globe size={18} color={Colors.textSecondary} />
              <Text style={[styles.actionText, { fontSize: 13 * fontScale }]}>{t('locations.website')}</Text>
              <Text style={[styles.actionValue, { fontSize: 13 * fontScale }]} numberOfLines={1}>
                {location.website.replace(/^https?:\/\//, '')}
              </Text>
            </TouchableOpacity>
          ) : null}

          {location.phone ? (
            <TouchableOpacity
              style={styles.actionRow}
              onPress={callStore}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('locations.phone')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Phone size={18} color={Colors.textSecondary} />
              <Text style={[styles.actionText, { fontSize: 13 * fontScale }]}>{t('locations.phone')}</Text>
              <Text style={[styles.actionValue, { fontSize: 13 * fontScale }]}>{location.phone}</Text>
            </TouchableOpacity>
          ) : null}
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
    paddingBottom: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    flex: 1,
  },
  orderButtonText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    flex: 1,
  },
  mapButtonText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  infoSubValue: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  hoursTable: {
    gap: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursDay: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  hoursTime: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: '700' as const,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    minHeight: 44,
  },
  actionText: {
    color: Colors.textSecondary,
    fontSize: 13,
    width: 70,
  },
  actionValue: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
});

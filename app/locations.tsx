import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { ChevronLeft, Clock, Globe, MapPin, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';
import LanguageToggle from '@/components/LanguageToggle';
import { useI18n } from '@/contexts/I18nContext';
import { storeLocations } from '@/mocks/data';
import { Weekday } from '@/types';

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
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const location = storeLocations[0];
  if (!location) return null;

  const openMaps = async () => {
    await Linking.openURL(mapUrlForAddress(location.address));
  };

  const openWebsite = async () => {
    if (!location.website) return;
    await Linking.openURL(location.website);
  };

  const callStore = async () => {
    if (!location.phone) return;
    await Linking.openURL(toTelUrl(location.phone));
  };

  const hoursByDay = new Map(location.hours.map((h) => [h.day, h.time]));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.backgroundLight]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageRow}>
          <LanguageToggle />
        </View>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('locations.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.storeName}>{location.name}</Text>
            <TouchableOpacity style={styles.mapButton} onPress={openMaps} activeOpacity={0.8}>
              <MapPin size={16} color={Colors.background} />
              <Text style={styles.mapButtonText}>{t('locations.openInMaps')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={18} color={Colors.primary} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>{t('locations.address')}</Text>
              <Text style={styles.infoValue}>{location.address}</Text>
              {location.place ? (
                <Text style={styles.infoSubValue}>
                  {t('locations.locatedAt', { place: location.place })}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Clock size={18} color={Colors.primary} />
            <View style={styles.infoTextBlock}>
              <Text style={styles.infoLabel}>{t('locations.hours')}</Text>
              <View style={styles.hoursTable}>
                {WEEKDAY_ORDER.map((day) => (
                  <View key={day} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{t(`weekday.${day}`)}</Text>
                    <Text style={styles.hoursTime}>{hoursByDay.get(day) ?? '--'}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {(location.website || location.phone) && <View style={styles.divider} />}

          {location.website ? (
            <TouchableOpacity style={styles.actionRow} onPress={openWebsite} activeOpacity={0.7}>
              <Globe size={18} color={Colors.textSecondary} />
              <Text style={styles.actionText}>{t('locations.website')}</Text>
              <Text style={styles.actionValue} numberOfLines={1}>
                {location.website.replace(/^https?:\/\//, '')}
              </Text>
            </TouchableOpacity>
          ) : null}

          {location.phone ? (
            <TouchableOpacity style={styles.actionRow} onPress={callStore} activeOpacity={0.7}>
              <Phone size={18} color={Colors.textSecondary} />
              <Text style={styles.actionText}>{t('locations.phone')}</Text>
              <Text style={styles.actionValue}>{location.phone}</Text>
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
  languageRow: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  storeName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: Colors.primary,
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


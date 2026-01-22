import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Bot, User } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import ChatMarkdown from '@/components/ChatMarkdown';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { trpcClient } from '@/lib/trpc';
import { storeLocations } from '@/mocks/data';
import { useCoupons } from '@/contexts/CouponsContext';
import { getTierFromBalance } from '@/lib/tier';
import TopBar from '@/components/TopBar';
import { useSettings } from '@/contexts/SettingsContext';

const QUICK_QUESTIONS = [
  'support.quick.balance',
  'support.quick.recharge',
  'support.quick.coupon',
  'support.quick.points',
];

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { backgroundGradient, fontScale } = useSettings();
  const { user } = useAuth();
  const { claimedCoupons, offers } = useCoupons();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');

  const aiName = t('ai.name');
  const welcomeMessage = `${t('ai.greeting')} ${t('ai.personality.friendly')}`;

  const couponsRef = useRef({ claimedCoupons, offers });
  useEffect(() => {
    couponsRef.current = { claimedCoupons, offers };
  }, [claimedCoupons, offers]);

  const tools = useMemo(() => {
    return {
      get_member_summary: {
        description:
          'Get the current logged-in member account summary (balance, points, tier). This tool can ONLY retrieve the current user\'s own information for privacy reasons.',
        zodSchema: z.object({}),
        execute: async (_input: unknown) => {
          if (!user?.memberId) {
            throw new Error('User is not logged in. Please ask them to log in first.');
          }

          const result = await trpcClient.menusafe.getBalance.query({
            memberId: user.memberId,
          });

          const balance = result?.balance ?? 0;
          const points = user?.points ?? 0;
          const tier = getTierFromBalance(balance);

          return JSON.stringify({
            tier,
            balance,
            points,
          });
        },
      },
      get_recent_transactions: {
        description: 'Get recent transactions for the logged-in member.',
        zodSchema: z.object({
          count: z.number().int().min(1).max(20).optional(),
        }),
        execute: async (input: unknown) => {
          const { count } = (input ?? {}) as { count?: number };
          if (!user?.id) {
            throw new Error('User is not logged in (missing userId).');
          }
          const result = await trpcClient.transactions.getRecent.query({
            userId: user.id,
            count: count ?? 5,
          });
          return JSON.stringify({ transactions: result });
        },
      },
      get_coupon_wallet: {
        description:
          'Get coupon wallet summary, including available/used/expired coupons and claimable offers.',
        zodSchema: z.object({
          status: z.enum(['available', 'used', 'expired', 'all']).optional(),
        }),
        execute: async (input: unknown) => {
          const { status } = (input ?? {}) as { status?: 'available' | 'used' | 'expired' | 'all' };
          const { claimedCoupons: claimed, offers: currentOffers } = couponsRef.current;

          const normalized = claimed.map((c) => ({
            id: c.definition.id,
            title: t(c.definition.title),
            discountText: t(c.definition.discountText),
            validTo: c.definition.validTo,
            status: c.state.status === 'used' ? 'used' : c.isExpired ? 'expired' : 'available',
          }));

          const filtered =
            status && status !== 'all' ? normalized.filter((c) => c.status === status) : normalized;

          return JSON.stringify({
            status: status ?? 'all',
            counts: {
              available: normalized.filter((c) => c.status === 'available').length,
              used: normalized.filter((c) => c.status === 'used').length,
              expired: normalized.filter((c) => c.status === 'expired').length,
            },
            coupons: filtered,
            offers: currentOffers.map((o) => ({
              id: o.definition.id,
              title: t(o.definition.title),
              tier: o.definition.tier,
              unlocked: o.isUnlocked,
            })),
          });
        },
      },
      get_store_location: {
        description: 'Get the current store location (address, hours, phone, website, map link).',
        zodSchema: z.object({}),
        execute: async (_input: unknown) => {
          const location = storeLocations[0];
          if (!location) throw new Error('No store location configured.');

          const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            location.address
          )}`;

          return JSON.stringify({
            name: t(location.name),
            address: location.address,
            place: location.place,
            website: location.website,
            phone: location.phone,
            hours: location.hours,
            mapUrl,
          });
        },
      },
    };
  }, [t, user?.id, user?.memberId, user?.points]);

  const { messages, sendMessage, status } = useRorkAgent({
    tools,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isLoading) return;
    
    console.log('[SupportChat] Sending message:', inputText);
    sendMessage(inputText.trim());
    setInputText('');
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [inputText, isLoading, sendMessage]);

  const handleQuickQuestion = useCallback((questionKey: string) => {
    const questionText = t(questionKey);
    console.log('[SupportChat] Quick question:', questionText);
    sendMessage(questionText);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [t, sendMessage]);

  const visibleMessages = messages.filter(m => m.role !== 'system');

  const renderMessageContent = (message: (typeof messages)[number]) => {
    if ('parts' in message && Array.isArray(message.parts)) {
      const renderedParts = message.parts
        .map((part, i) => {
          if (!part || typeof part !== 'object') return null;
          
          if (part.type === 'text' && typeof part.text === 'string' && part.text.trim()) {
            return (
              <ChatMarkdown
                key={`${message.id}-${i}`}
                text={part.text}
                variant={message.role === 'assistant' ? 'assistant' : 'user'}
              />
            );
          }
          if (part.type === 'tool') {
            const state = (part as any).state as string | undefined;
            const toolName = (part as any).toolName ?? (part as any).name ?? 'tool';

            const errorText = (part as any).errorText ?? (part as any).error ?? null;

            if (state === 'output-error') {
              return (
                <View key={`${message.id}-${i}`} style={styles.toolCard}>
                  <Text style={[styles.toolTitle, { fontSize: 12 * fontScale }]}>{String(toolName)}</Text>
                  <Text style={[styles.toolErrorText, { fontSize: 12 * fontScale, lineHeight: 16 * fontScale }]}>
                    {String(errorText ?? 'Tool failed')}
                  </Text>
                </View>
              );
            }

            if (state === 'output-available') {
              return null;
            }

            return (
              <View key={`${message.id}-${i}`} style={styles.toolIndicator}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={[styles.toolText, { fontSize: 12 * fontScale }]}>{t('common.loading')}</Text>
              </View>
            );
          }
          return null;
        })
        .filter(Boolean);
      
      return renderedParts.length > 0 ? renderedParts : null;
    }
    
    if ('content' in message && typeof message.content === 'string' && message.content.trim()) {
      return (
        <ChatMarkdown
          text={message.content}
          variant={message.role === 'assistant' ? 'assistant' : 'user'}
        />
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={backgroundGradient}
        style={StyleSheet.absoluteFill}
      />

      <TopBar
        title={t('support.title')}
        leftAction="back"
        style={styles.topBar}
        right={
          <View style={[styles.onlineStatus, { marginTop: 0 }]}>
            <View style={styles.aiIndicator}>
              <Text style={[styles.aiText, { fontSize: 9 * fontScale }]}>{aiName}</Text>
            </View>
            <Text style={[styles.onlineText, { fontSize: 11 * fontScale }]}>{t('support.online')}</Text>
          </View>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {visibleMessages.length === 0 && (
            <View style={[styles.messageRow, styles.botRow]}>
              <View style={styles.avatar}>
                <Bot size={18} color={Colors.primary} />
              </View>
              <View style={[styles.messageBubble, styles.botBubble]}>
                <Text
                  style={[
                    styles.messageText,
                    styles.botText,
                    { fontSize: 14 * fontScale, lineHeight: 20 * fontScale },
                  ]}
                >
                  {welcomeMessage}
                </Text>
              </View>
            </View>
          )}

          {visibleMessages.map((message) => {
            const content = renderMessageContent(message);
            if (!content) return null;
            return (
              <View
                key={message.id}
                style={[
                  styles.messageRow,
                  message.role === 'assistant' ? styles.botRow : styles.userRow,
                ]}
              >
                {message.role === 'assistant' && (
                  <View style={styles.avatar}>
                    <Bot size={18} color={Colors.primary} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.role === 'assistant' ? styles.botBubble : styles.userBubble,
                  ]}
                >
                  {content}
                </View>
                {message.role === 'user' && (
                  <View style={[styles.avatar, styles.userAvatar]}>
                    <User size={18} color={Colors.background} />
                  </View>
                )}
              </View>
            );
          })}

          {isLoading && (
            <View style={[styles.messageRow, styles.botRow]}>
              <View style={styles.avatar}>
                <Bot size={18} color={Colors.primary} />
              </View>
              <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
              </View>
            </View>
          )}

          {visibleMessages.length === 0 && (
            <View style={styles.quickQuestions}>
              <Text style={[styles.quickTitle, { fontSize: 13 * fontScale }]}>{t('support.quickTitle')}</Text>
              {QUICK_QUESTIONS.map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickButton}
                  onPress={() => handleQuickQuestion(q)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={t(q)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={[styles.quickText, { fontSize: 13 * fontScale }]}>{t(q)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { fontSize: 15 * fontScale }]}
              placeholder={t('support.inputPlaceholder')}
              placeholderTextColor={Colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('support.send')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.textMuted} />
              ) : (
                <Send size={20} color={inputText.trim() ? Colors.background : Colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  aiIndicator: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  aiText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  onlineText: {
    fontSize: 11,
    color: Colors.success,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(201, 169, 98, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: Colors.primary,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
  },
  botBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  botText: {
    color: Colors.text,
  },
  userText: {
    color: Colors.background,
  },
  toolIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  toolCard: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  toolTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700' as const,
  },

  toolErrorText: {
    color: Colors.error,
    fontSize: 12,
    lineHeight: 16,
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
    opacity: 0.4,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  quickQuestions: {
    marginTop: 8,
  },
  quickTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  quickButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickText: {
    fontSize: 13,
    color: Colors.text,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
});

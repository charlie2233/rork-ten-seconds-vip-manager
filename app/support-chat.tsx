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
import { ArrowLeft, Send, Bot, User, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import Colors from '@/constants/colors';
import LanguageToggle from '@/components/LanguageToggle';
import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { trpcClient } from '@/lib/trpc';
import { storeLocations } from '@/mocks/data';
import { useCoupons } from '@/contexts/CouponsContext';
import { getTierFromBalance } from '@/lib/tier';

const QUICK_QUESTIONS = [
  'support.quick.balance',
  'support.quick.recharge',
  'support.quick.coupon',
  'support.quick.points',
];

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const { user } = useAuth();
  const { claimedCoupons, offers } = useCoupons();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');

  const welcomeMessage = t('support.welcomeMessage');

  const couponsRef = useRef({ claimedCoupons, offers });
  useEffect(() => {
    couponsRef.current = { claimedCoupons, offers };
  }, [claimedCoupons, offers]);

  const tools = useMemo(() => {
    return {
      get_member_summary: {
        description:
          'Get the current member account summary (balance, points, tier) from the VIP system.',
        zodSchema: z.object({
          memberId: z.string().min(1).optional(),
        }),
        execute: async (input: unknown) => {
          const { memberId } = (input ?? {}) as { memberId?: string };
          const resolvedMemberId = memberId ?? user?.memberId;
          if (!resolvedMemberId) {
            throw new Error('User is not logged in (missing memberId).');
          }

          const result = await trpcClient.menusafe.getLatestBalance.query({
            memberId: resolvedMemberId,
          });

          const balance = result?.balance ?? 0;
          const points = result?.points ?? 0;
          const tier = getTierFromBalance(balance);

          return JSON.stringify({
            memberId: resolvedMemberId,
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
          return JSON.stringify({ userId: user.id, transactions: result });
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
            title: c.definition.title,
            discountText: c.definition.discountText,
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
              title: o.definition.title,
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
            name: location.name,
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
  }, [user?.id, user?.memberId]);

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

  const renderToolOutput = (output: unknown) => {
    if (typeof output === 'string') return output;
    try {
      return JSON.stringify(output, null, 2);
    } catch {
      return String(output);
    }
  };

  const renderMessageContent = (message: (typeof messages)[number]) => {
    if ('parts' in message && Array.isArray(message.parts)) {
      const renderedParts = message.parts
        .map((part, i) => {
          if (!part || typeof part !== 'object') return null;
          
          if (part.type === 'text' && typeof part.text === 'string' && part.text.trim()) {
            return (
              <Text
                key={`${message.id}-${i}`}
                style={[
                  styles.messageText,
                  message.role === 'assistant' ? styles.botText : styles.userText,
                ]}
              >
                {part.text}
              </Text>
            );
          }
          if (part.type === 'tool') {
            const state = (part as any).state as string | undefined;
            const toolName = (part as any).toolName ?? (part as any).name ?? 'tool';
            const output = (part as any).output;
            const errorText = (part as any).errorText ?? (part as any).error ?? null;

            if (state === 'output-error') {
              return (
                <View key={`${message.id}-${i}`} style={styles.toolCard}>
                  <Text style={styles.toolTitle}>{String(toolName)}</Text>
                  <Text style={styles.toolErrorText}>{String(errorText ?? 'Tool failed')}</Text>
                </View>
              );
            }

            if (state === 'output-available') {
              return (
                <View key={`${message.id}-${i}`} style={styles.toolCard}>
                  <Text style={styles.toolTitle}>{String(toolName)}</Text>
                  <Text style={styles.toolOutput}>{renderToolOutput(output)}</Text>
                </View>
              );
            }

            return (
              <View key={`${message.id}-${i}`} style={styles.toolIndicator}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.toolText}>{t('common.loading')}</Text>
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
        <Text
          style={[
            styles.messageText,
            message.role === 'assistant' ? styles.botText : styles.userText,
          ]}
        >
          {message.content}
        </Text>
      );
    }
    
    return null;
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
        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={styles.headerTitle}>{t('support.title')}</Text>
          </View>
          <View style={styles.onlineStatus}>
            <View style={styles.aiIndicator}>
              <Text style={styles.aiText}>AI</Text>
            </View>
            <Text style={styles.onlineText}>{t('support.online')}</Text>
          </View>
        </View>
        <LanguageToggle variant="icon" align="right" />
      </View>

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
                <Text style={[styles.messageText, styles.botText]}>
                  {welcomeMessage}
                </Text>
              </View>
            </View>
          )}

          {visibleMessages.map((message) => (
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
                {renderMessageContent(message)}
              </View>
              {message.role === 'user' && (
                <View style={[styles.avatar, styles.userAvatar]}>
                  <User size={18} color={Colors.background} />
                </View>
              )}
            </View>
          ))}

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
              <Text style={styles.quickTitle}>{t('support.quickTitle')}</Text>
              {QUICK_QUESTIONS.map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickButton}
                  onPress={() => handleQuickQuestion(q)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  <Text style={styles.quickText}>{t(q)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
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
  placeholder: {
    width: 40,
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
  toolOutput: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
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

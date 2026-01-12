import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Bot, User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useI18n } from '@/contexts/I18nContext';
import Colors from '@/constants/colors';

type Message = {
  id: string;
  text: string;
  isBot: boolean;
  time: string;
};

const QUICK_QUESTIONS = [
  'support.quick.balance',
  'support.quick.recharge',
  'support.quick.coupon',
  'support.quick.points',
];

export default function SupportChatScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const scrollViewRef = useRef<ScrollView>(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('support.welcomeMessage'),
      isBot: true,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('support.autoReply'),
        isBot: true,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 1000);

    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleQuickQuestion = (questionKey: string) => {
    sendMessage(t(questionKey));
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
          <Text style={styles.headerTitle}>{t('support.title')}</Text>
          <View style={styles.onlineStatus}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>{t('support.online')}</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
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
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.isBot ? styles.botRow : styles.userRow,
              ]}
            >
              {message.isBot && (
                <View style={styles.avatar}>
                  <Bot size={18} color={Colors.primary} />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isBot ? styles.botBubble : styles.userBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isBot ? styles.botText : styles.userText,
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    message.isBot ? styles.botTime : styles.userTime,
                  ]}
                >
                  {message.time}
                </Text>
              </View>
              {!message.isBot && (
                <View style={[styles.avatar, styles.userAvatar]}>
                  <User size={18} color={Colors.background} />
                </View>
              )}
            </View>
          ))}

          {messages.length === 1 && (
            <View style={styles.quickQuestions}>
              <Text style={styles.quickTitle}>{t('support.quickTitle')}</Text>
              {QUICK_QUESTIONS.map((q, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickButton}
                  onPress={() => handleQuickQuestion(q)}
                  activeOpacity={0.7}
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
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim()}
              activeOpacity={0.7}
            >
              <Send size={20} color={inputText.trim() ? Colors.background : Colors.textMuted} />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 4,
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
  messageTime: {
    fontSize: 10,
    marginTop: 6,
  },
  botTime: {
    color: Colors.textMuted,
  },
  userTime: {
    color: 'rgba(0,0,0,0.5)',
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

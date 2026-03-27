import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

const LOGIN_ATTEMPTS_KEY = 'security_login_attempts';
const SESSIONS_KEY = 'security_sessions';
const CURRENT_SESSION_KEY = 'security_current_session';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ALLOWED_DEEP_LINK_SCHEMES = ['tenseconds://', 'exp://'];

export interface LoginAttempt {
  timestamp: number;
  success: boolean;
  memberId: string;
}

export interface Session {
  id: string;
  deviceName: string;
  platform: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

interface LoginAttemptsData {
  attempts: LoginAttempt[];
  lockedUntil: number | null;
}

function generateSessionId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `session_${Date.now()}_${result}`;
}

function getDeviceName(): string {
  if (Platform.OS === 'ios') return 'iPhone';
  if (Platform.OS === 'android') return 'Android Device';
  return 'Web Browser';
}

export const [SecurityProvider, useSecurity] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  const attemptsQuery = useQuery({
    queryKey: ['security_attempts'],
    queryFn: async (): Promise<LoginAttemptsData> => {
      try {
        const stored = await AsyncStorage.getItem(LOGIN_ATTEMPTS_KEY);
        if (stored) {
          const data = JSON.parse(stored) as LoginAttemptsData;
          const now = Date.now();
          const recentAttempts = data.attempts.filter(
            (a) => now - a.timestamp < LOCKOUT_DURATION_MS
          );
          return {
            attempts: recentAttempts,
            lockedUntil: data.lockedUntil && data.lockedUntil > now ? data.lockedUntil : null,
          };
        }
      } catch (e) {
        console.log('[Security] Failed to load attempts:', e);
      }
      return { attempts: [], lockedUntil: null };
    },
    staleTime: 1000,
  });

  const sessionsQuery = useQuery({
    queryKey: ['security_sessions'],
    queryFn: async (): Promise<Session[]> => {
      try {
        const stored = await AsyncStorage.getItem(SESSIONS_KEY);
        const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
        if (stored) {
          const sessions = JSON.parse(stored) as Session[];
          const now = Date.now();
          const validSessions = sessions
            .filter((s) => {
              const lastActive = new Date(s.lastActiveAt).getTime();
              return now - lastActive < SESSION_EXPIRY_MS;
            })
            .map((s) => ({ ...s, isCurrent: s.id === currentSessionId }));
          return validSessions;
        }
      } catch (e) {
        console.log('[Security] Failed to load sessions:', e);
      }
      return [];
    },
    staleTime: 5000,
  });

  useEffect(() => {
    const data = attemptsQuery.data;
    if (!data?.lockedUntil) {
      setLockoutRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((data.lockedUntil! - now) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) {
        queryClient.invalidateQueries({ queryKey: ['security_attempts'] });
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [attemptsQuery.data, queryClient]);

  const recordAttemptMutation = useMutation({
    mutationFn: async ({ memberId, success }: { memberId: string; success: boolean }) => {
      const current = queryClient.getQueryData<LoginAttemptsData>(['security_attempts']) ?? {
        attempts: [],
        lockedUntil: null,
      };

      const now = Date.now();
      const newAttempt: LoginAttempt = { timestamp: now, success, memberId };
      
      let attempts = [...current.attempts, newAttempt].filter(
        (a) => now - a.timestamp < LOCKOUT_DURATION_MS
      );

      const recentFailures = attempts.filter((a) => !a.success);
      let lockedUntil = current.lockedUntil;

      if (!success && recentFailures.length >= MAX_LOGIN_ATTEMPTS) {
        lockedUntil = now + LOCKOUT_DURATION_MS;
        console.log('[Security] Account locked due to too many failed attempts');
      }

      if (success) {
        attempts = [];
        lockedUntil = null;
      }

      const data: LoginAttemptsData = { attempts, lockedUntil };
      await AsyncStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['security_attempts'], data);
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const sessionId = generateSessionId();
      const newSession: Session = {
        id: sessionId,
        deviceName: getDeviceName(),
        platform: Platform.OS,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        isCurrent: true,
      };

      const current = queryClient.getQueryData<Session[]>(['security_sessions']) ?? [];
      const updated = [...current.map((s) => ({ ...s, isCurrent: false })), newSession];

      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      await AsyncStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      
      console.log('[Security] New session created:', sessionId);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['security_sessions'], data);
    },
  });

  const updateSessionActivityMutation = useMutation({
    mutationFn: async () => {
      const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (!currentSessionId) return null;

      const current = queryClient.getQueryData<Session[]>(['security_sessions']) ?? [];
      const updated = current.map((s) =>
        s.id === currentSessionId
          ? { ...s, lastActiveAt: new Date().toISOString() }
          : s
      );

      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['security_sessions'], data);
      }
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const current = queryClient.getQueryData<Session[]>(['security_sessions']) ?? [];
      const updated = current.filter((s) => s.id !== sessionId);

      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));

      const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (currentSessionId === sessionId) {
        await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
      }

      console.log('[Security] Session revoked:', sessionId);
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['security_sessions'], data);
    },
  });

  const revokeAllOtherSessionsMutation = useMutation({
    mutationFn: async () => {
      const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      const current = queryClient.getQueryData<Session[]>(['security_sessions']) ?? [];
      const updated = current.filter((s) => s.id === currentSessionId);

      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
      console.log('[Security] All other sessions revoked');
      return updated;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['security_sessions'], data);
    },
  });

  const clearAllSessionsMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(SESSIONS_KEY);
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
      console.log('[Security] All sessions cleared');
      return [];
    },
    onSuccess: () => {
      queryClient.setQueryData(['security_sessions'], []);
    },
  });

  const isAccountLocked = useCallback(() => {
    const data = attemptsQuery.data;
    if (!data?.lockedUntil) return false;
    return Date.now() < data.lockedUntil;
  }, [attemptsQuery.data]);

  const getRemainingAttempts = useCallback(() => {
    const data = attemptsQuery.data;
    if (!data) return MAX_LOGIN_ATTEMPTS;
    const failures = data.attempts.filter((a) => !a.success).length;
    return Math.max(0, MAX_LOGIN_ATTEMPTS - failures);
  }, [attemptsQuery.data]);

  const validateDeepLink = useCallback((url: string): boolean => {
    if (!url) return false;
    const isAllowed = ALLOWED_DEEP_LINK_SCHEMES.some((scheme) =>
      url.toLowerCase().startsWith(scheme.toLowerCase())
    );
    if (!isAllowed) {
      console.warn('[Security] Blocked suspicious deep link:', url);
    }
    return isAllowed;
  }, []);

  const { mutateAsync: recordAttemptAsync } = recordAttemptMutation;
  const { mutateAsync: createSessionAsync } = createSessionMutation;
  const { mutateAsync: updateSessionActivityAsync } = updateSessionActivityMutation;
  const { mutateAsync: revokeSessionAsync } = revokeSessionMutation;
  const { mutateAsync: revokeAllOtherSessionsAsync } = revokeAllOtherSessionsMutation;
  const { mutateAsync: clearAllSessionsAsync } = clearAllSessionsMutation;

  const recordLoginAttempt = useCallback(
    (memberId: string, success: boolean) => {
      return recordAttemptAsync({ memberId, success });
    },
    [recordAttemptAsync]
  );

  const createSession = useCallback(() => {
    return createSessionAsync();
  }, [createSessionAsync]);

  const updateSessionActivity = useCallback(() => {
    return updateSessionActivityAsync();
  }, [updateSessionActivityAsync]);

  const revokeSession = useCallback(
    (sessionId: string) => {
      return revokeSessionAsync(sessionId);
    },
    [revokeSessionAsync]
  );

  const revokeAllOtherSessions = useCallback(() => {
    return revokeAllOtherSessionsAsync();
  }, [revokeAllOtherSessionsAsync]);

  const clearAllSessions = useCallback(() => {
    return clearAllSessionsAsync();
  }, [clearAllSessionsAsync]);

  return {
    isAccountLocked,
    getRemainingAttempts,
    lockoutRemaining,
    maxAttempts: MAX_LOGIN_ATTEMPTS,
    sessions: sessionsQuery.data ?? [],
    isLoadingSessions: sessionsQuery.isLoading,
    recordLoginAttempt,
    createSession,
    updateSessionActivity,
    revokeSession,
    revokeAllOtherSessions,
    clearAllSessions,
    validateDeepLink,
  };
});

import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { mockUser } from '@/mocks/data';

const AUTH_STORAGE_KEY = 'auth_user';
const GUEST_STORAGE_KEY = 'auth_guest_mode';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      console.log('[AuthContext] Loading auth state...');
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        console.log('[AuthContext] Stored auth:', stored ? 'found' : 'not found');
        if (stored) {
          const userData = JSON.parse(stored) as User;
          return userData;
        }
      } catch (error) {
        console.error('[AuthContext] Failed to restore auth state:', error);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return null;
    },
    staleTime: Infinity,
    retry: false,
  });

  const guestQuery = useQuery({
    queryKey: ['auth_guest'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
        return stored === '1';
      } catch {
        return false;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  // Derive state directly from the query cache to avoid synchronization issues
  const user = authQuery.data ?? null;
  const isAuthenticated = !!user;
  const isGuest = guestQuery.data ?? false;

  const loginMutation = useMutation({
    mutationFn: async ({ memberId, password }: { memberId: string; password: string }) => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (memberId.length >= 4 && password.length >= 4) {
        const userData: User = {
          ...mockUser,
          memberId: memberId.toUpperCase(),
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return userData;
      }
      throw new Error('auth.invalidCredentials');
    },
    onSuccess: (userData) => {
      // Update query cache immediately
      queryClient.setQueryData(['auth'], userData);
      // Logged in: exit guest mode
      queryClient.setQueryData(['auth_guest'], false);
      void AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    },
    onSuccess: () => {
      // Update query cache immediately
      queryClient.setQueryData(['auth'], null);
      // Keep the app usable after logout
      queryClient.setQueryData(['auth_guest'], true);
      void AsyncStorage.setItem(GUEST_STORAGE_KEY, '1');
    },
  });

  const login = (memberId: string, password: string) => {
    return loginMutation.mutateAsync({ memberId, password });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const setGuestMode = async (next: boolean) => {
    queryClient.setQueryData(['auth_guest'], next);
    try {
      if (next) {
        await AsyncStorage.setItem(GUEST_STORAGE_KEY, '1');
      } else {
        await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  };

  const enterGuestMode = () => setGuestMode(true);
  const exitGuestMode = () => setGuestMode(false);

  const isLoading =
    (authQuery.isLoading && !authQuery.isFetched) || (guestQuery.isLoading && !guestQuery.isFetched);
  
  console.log('[AuthContext] State:', { isLoading, isAuthenticated, queryStatus: authQuery.status });

  return {
    user,
    isAuthenticated,
    isLoading,
    isGuest,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null,
    login,
    logout,
    enterGuestMode,
    exitGuestMode,
    setUserName: async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const current = queryClient.getQueryData<User | null>(['auth']);
      if (!current) return;
      const next: User = { ...current, name: trimmed };
      queryClient.setQueryData(['auth'], next);
      try {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
  };
});

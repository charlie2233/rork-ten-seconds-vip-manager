import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/types';
import { mockUser } from '@/mocks/data';

const AUTH_STORAGE_KEY = 'auth_user';

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

  // Derive state directly from the query cache to avoid synchronization issues
  const user = authQuery.data ?? null;
  const isAuthenticated = !!user;

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
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    },
    onSuccess: () => {
      // Update query cache immediately
      queryClient.setQueryData(['auth'], null);
    },
  });

  const login = (memberId: string, password: string) => {
    return loginMutation.mutateAsync({ memberId, password });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  const isLoading = authQuery.isLoading && !authQuery.isFetched;
  
  console.log('[AuthContext] State:', { isLoading, isAuthenticated, queryStatus: authQuery.status });

  return {
    user,
    isAuthenticated,
    isLoading,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null,
    login,
    logout,
  };
});

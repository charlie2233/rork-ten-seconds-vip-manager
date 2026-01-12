import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { mockUser } from '@/mocks/data';

const AUTH_STORAGE_KEY = 'auth_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  const authQuery = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored) as User;
        return userData;
      }
      return null;
    },
  });

  useEffect(() => {
    if (authQuery.data) {
      setUser(authQuery.data);
      setIsAuthenticated(true);
    } else if (authQuery.data === null && !authQuery.isLoading) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [authQuery.data, authQuery.isLoading]);

  const loginMutation = useMutation({
    mutationFn: async ({ memberId, password }: { memberId: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (memberId.length >= 4 && password.length >= 4) {
        const userData: User = {
          ...mockUser,
          memberId: memberId.toUpperCase(),
        };
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
        return userData;
      }
      throw new Error('会员ID或密码错误');
    },
    onSuccess: (userData) => {
      setUser(userData);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    },
    onSuccess: () => {
      setUser(null);
      setIsAuthenticated(false);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const login = (memberId: string, password: string) => {
    return loginMutation.mutateAsync({ memberId, password });
  };

  const logout = () => {
    return logoutMutation.mutateAsync();
  };

  return {
    user,
    isAuthenticated,
    isLoading: authQuery.isLoading,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error?.message || null,
    login,
    logout,
  };
});

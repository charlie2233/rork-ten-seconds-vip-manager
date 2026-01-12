export interface User {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  balance: number;
  points: number;
  tier: 'silver' | 'gold' | 'platinum' | 'diamond';
  joinDate: string;
  avatar?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'spend' | 'bonus' | 'refund';
  amount: number;
  description: string;
  date: string;
  balance: number;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'silver' | 'gold' | 'platinum' | 'diamond';
  isActive: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

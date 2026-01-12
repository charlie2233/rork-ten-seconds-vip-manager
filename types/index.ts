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

export type CouponStatus = 'available' | 'used' | 'expired';

export interface CouponDefinition {
  id: string;
  title: string;
  description: string;
  discountText: string;
  minSpendText?: string;
  validFrom: string; // ISO date
  validTo: string; // ISO date
  tier: User['tier'];
  code: string;
  themeColor?: string;
}

export interface UserCoupon {
  couponId: string;
  status: CouponStatus;
  claimedAt: string; // ISO datetime
  usedAt?: string; // ISO datetime
}

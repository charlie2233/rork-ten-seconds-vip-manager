export interface User {
  id: string;
  memberId: string;
  name: string;
  phone: string;
  balance: number;
  points: number;
  tier: 'silver' | 'gold' | 'diamond' | 'platinum' | 'blackGold';
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

export interface PointsRecord {
  id: string;
  delta: number;
  description?: string;
  couponId?: string;
  date: string; // ISO datetime
  balance: number;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: User['tier'];
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
  costPoints?: number;
  repeatable?: boolean;
  validFrom: string; // ISO date
  validTo: string; // ISO date
  tier: User['tier'];
  code: string;
  themeColor?: string;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  status: CouponStatus;
  claimedAt: string; // ISO datetime
  usedAt?: string; // ISO datetime
}

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface StoreHours {
  day: Weekday;
  time: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  place?: string;
  website?: string;
  phone?: string;
  hours: StoreHours[];
}

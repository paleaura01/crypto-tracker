// Authentication and user management types
import type { UUID, TimestampFields } from './common';

// Auth request/response types
export interface AuthRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  user: User | null;
  session: AuthSession | null;
  error?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  username?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface UserProfile {
  id: UUID;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
  created_at: string;
  updated_at: string;
}

export interface User extends TimestampFields {
  id: UUID;
  email: string;
  email_verified: boolean;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  phone_verified?: boolean;
  last_sign_in_at?: string;
  preferences: UserPreferences;
  subscription: UserSubscription;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: string;
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  price_alerts: boolean;
  portfolio_updates: boolean;
  security_alerts: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  portfolio_public: boolean;
  show_balances: boolean;
  analytics_enabled: boolean;
  share_anonymous_data: boolean;
}

export interface UserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  trial_end?: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'past_due' | 'canceled' | 'trialing';

// Session and authentication
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface AuthEvent {
  event: AuthEventType;
  session: Session | null;
  user: User | null;
}

export type AuthEventType = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

// API Keys and third-party integrations
export interface ApiKey extends TimestampFields {
  id: UUID;
  user_id: UUID;
  name: string;
  provider: ApiProvider;
  key_hash: string; // Hashed for security
  permissions: ApiPermission[];
  is_active: boolean;
  last_used_at?: string;
  expires_at?: string;
}

export type ApiProvider = 
  | 'coinbase'
  | 'binance'
  | 'kraken'
  | 'alchemy'
  | 'infura'
  | 'moralis'
  | 'covalent';

export type ApiPermission = 
  | 'read_portfolio'
  | 'read_transactions'
  | 'read_balances'
  | 'execute_trades'
  | 'manage_keys';

// Role-based access control
export interface UserRole {
  id: UUID;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  id: UUID;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

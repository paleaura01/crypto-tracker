/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock validation functions first
vi.mock('../utils/validation.js', () => ({
  validateEmail: vi.fn((email: string) => email.includes('@')),
  validateUser: vi.fn(() => true),
  validatePassword: vi.fn((password: string) => password.length >= 8)
}));

// Mock API helpers
vi.mock('../utils/api-helpers.js', () => ({
  createApiResponse: vi.fn((data) => ({ success: true, data })),
  createErrorResponse: vi.fn((error) => ({ success: false, error })),
  SimpleCache: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn()
  }))
}));

// Mock Supabase client
vi.mock('../supabaseClient.js', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  }
}));

import { AuthService } from './auth-service.js';
import { supabase } from '../supabaseClient.js';

// Complete mock objects for consistent testing
const createMockUser = (overrides = {}) => ({
  id: '123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2024-01-01T00:00:00.000Z',
  phone_confirmed_at: '2024-01-01T00:00:00.000Z',
  confirmation_sent_at: '2024-01-01T00:00:00.000Z',
  recovery_sent_at: '2024-01-01T00:00:00.000Z',
  email_change_sent_at: '2024-01-01T00:00:00.000Z',
  new_email: '',
  invited_at: '2024-01-01T00:00:00.000Z',
  action_link: '',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  phone: '',
  app_metadata: {},
  user_metadata: {
    full_name: 'Test User',
    username: 'Test'
  },
  identities: [],
  factors: [],
  ...overrides
});

const createMockSession = (user = createMockUser()) => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user
});

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = AuthService.getInstance();
  });  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = createMockUser();
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        username: 'Test'
      });

      expect(result.success).toBe(true);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
            username: 'Test'
          }
        }
      });
    });
  });
  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
  describe('getCurrentSession', () => {
    it('should return current session when authenticated', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession(mockUser);
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSession); // Remove .session access
    });
  });
  describe('getUserProfile', () => {
    it('should return user profile when authenticated', async () => {
      const mockUser = createMockUser();
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getUserProfile('123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });
  });
});
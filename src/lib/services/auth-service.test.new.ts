/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockSupabaseAuth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } }
  }))
};

vi.mock('../supabaseClient.js', () => ({
  supabase: {
    auth: mockSupabaseAuth
  }
}));

// Mock validation functions
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

import { AuthService } from './auth-service.js';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = AuthService.getInstance();
  });

  describe('register', () => {
    it('should register successfully with valid data', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        username: 'testuser'
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
            username: 'testuser' // Remove preferred_name, use existing properties
          }
        }
      });
    });

    it('should handle registration errors', async () => {
      const mockError = { message: 'Email already registered' };
      mockSupabaseAuth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should handle login errors', async () => {
      const mockError = { message: 'Invalid credentials' };
      mockSupabaseAuth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.success).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockSupabaseAuth.signOut.mockResolvedValue({ error: null });

      const result = await authService.logout();

      expect(result.success).toBe(true);
      expect(mockSupabaseAuth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors', async () => {
      const mockError = { message: 'Logout failed' };
      mockSupabaseAuth.signOut.mockResolvedValue({ error: mockError });

      const result = await authService.logout();

      expect(result.success).toBe(false);
    });
  });

  describe('getCurrentSession', () => {
    it('should return current session when authenticated', async () => {
      const mockSession = { 
        access_token: 'token', 
        user: { id: '123', email: 'test@example.com' } 
      };
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSession); // Remove .session access
    });

    it('should handle no session', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.getCurrentSession();

      expect(result.success).toBe(true);
      expect(result.data).toBe(null); // Fix: remove .session access
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getUserProfile(mockUser.id);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should handle no user', async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await authService.getUserProfile('test-user-id'); // Add required userId parameter

      expect(result.success).toBe(false);
      expect(result.error).toContain('No authenticated user');
    });
  });

  describe('getUserSession', () => {
    it('should return user session', async () => {
      const mockSession = { 
        access_token: 'token', 
        user: { id: 'test-user-id', email: 'test@example.com' } 
      };
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getUserSession('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data?.user.id).toBe('test-user-id'); // Fix: access user through data property
    });

    it('should handle no session', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const result = await authService.getUserSession('test-user-id');

      expect(result.success).toBe(true);
      expect(result.data).toBe(null); // Fix: check data property instead of user
    });
  });
});

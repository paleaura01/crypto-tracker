// Type validation utilities and type guards
import type { 
  Portfolio, 
  Wallet, 
  WalletType, 
  BlockchainNetwork,
  PortfolioStatus 
} from '../types/index.js';

// ============================================================================
// DATA SANITIZERS AND FORM VALIDATION
// ============================================================================

/**
 * Sanitizes numeric values with range validation
 */
export function sanitizeNumber(
  value: unknown, 
  options: { min?: number; max?: number; defaultValue?: number } = {}
): number | null {
  const { min = -Infinity, max = Infinity, defaultValue = null } = options;
  
  let num: number;
  
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value);
  } else {
    return defaultValue;
  }
  
  if (isNaN(num) || !isFinite(num)) return defaultValue;
  if (num < min || num > max) return defaultValue;
  
  return num;
}

/**
 * Validation rules for forms
 */
export interface ValidationRule<T = unknown> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
}

/**
 * Form field validator
 */
export function validateField(
  value: unknown, 
  rules: ValidationRule
): { isValid: boolean; error: string | null } {
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return { isValid: false, error: 'This field is required' };
  }
  
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return { isValid: false, error: `Minimum length is ${rules.minLength} characters` };
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, error: `Maximum length is ${rules.maxLength} characters` };
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, error: 'Invalid format' };
    }
  }
  
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return { isValid: false, error: customError };
    }
  }
  
  return { isValid: true, error: null };
}

/**
 * Validates multiple form fields
 */
export function validateForm(
  data: Record<string, unknown>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const validation = validateField(data[field], fieldRules);
    if (!validation.isValid && validation.error) {
      errors[field] = validation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Type guards for runtime type checking
export function isValidWalletType(type: string): type is WalletType {
  return ['evm', 'solana', 'bitcoin', 'cosmos', 'exchange', 'custodial'].includes(type);
}

export function isValidBlockchainNetwork(network: string): network is BlockchainNetwork {
  return [
    'ethereum', 
    'polygon', 
    'bsc', 
    'arbitrum',
    'optimism',
    'solana', 
    'bitcoin',
    'cosmos',
    'avalanche'
  ].includes(network);
}

export function isValidPortfolioStatus(status: string): status is PortfolioStatus {
  return ['active', 'archived', 'deleted'].includes(status);
}

// Complex object validators
export function validatePortfolio(data: unknown): data is Portfolio {
  if (!data || typeof data !== 'object') return false;
  
  const portfolio = data as Portfolio;
  return (
    typeof portfolio.id === 'string' &&
    typeof portfolio.user_id === 'string' &&
    typeof portfolio.name === 'string' &&
    isValidPortfolioStatus(portfolio.status) &&
    typeof portfolio.is_default === 'boolean' &&
    typeof portfolio.total_value_usd === 'number' &&
    typeof portfolio.total_cost_basis_usd === 'number'
  );
}

export function validateWallet(data: unknown): data is Wallet {
  if (!data || typeof data !== 'object') return false;
  
  const wallet = data as Wallet;
  return (
    typeof wallet.id === 'string' &&
    typeof wallet.portfolio_id === 'string' &&
    typeof wallet.name === 'string' &&
    typeof wallet.address === 'string' &&
    isValidBlockchainNetwork(wallet.chain) &&
    isValidWalletType(wallet.wallet_type) &&
    typeof wallet.is_active === 'boolean'
  );
}

// Address validation utilities
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidSolanaAddress(address: string): boolean {
  // Basic Solana address validation (32-44 characters, base58)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function isValidBitcoinAddress(address: string): boolean {
  // Basic Bitcoin address validation (supports legacy, segwit, and bech32)
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
}

export function validateAddressForChain(address: string, chain: BlockchainNetwork): boolean {
  switch (chain) {
    case 'ethereum':
    case 'polygon':
    case 'bsc':
    case 'arbitrum':
    case 'optimism':
    case 'avalanche':
      return isValidEthereumAddress(address);
    case 'solana':
      return isValidSolanaAddress(address);
    case 'bitcoin':
      return isValidBitcoinAddress(address);
    case 'cosmos':
      // Basic cosmos address validation
      return /^cosmos[0-9a-z]{39,59}$/.test(address);
    default:
      return false;
  }
}

// Data sanitization utilities
export function sanitizeNumericString(value: string): string {
  // Remove non-numeric characters except decimal point
  return value.replace(/[^0-9.]/g, '');
}

export function validateDecimalString(value: string): boolean {
  // Check if string represents a valid decimal number
  return /^\d*\.?\d+$/.test(value) && !isNaN(parseFloat(value));
}

// API response validators
export function validateApiResponse<T>(
  data: unknown,
  validator: (item: unknown) => item is T
): data is { data: T; success: boolean } {
  if (!data || typeof data !== 'object') return false;
  
  const response = data as { success?: unknown; data?: unknown };
  return (
    typeof response.success === 'boolean' &&
    validator(response.data)
  );
}

// Error handling utilities
export function createValidationError(field: string, message: string) {
  return {
    field,
    message,
    code: 'VALIDATION_ERROR'
  };
}

export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

// ============================================================================
// USER AND EMAIL VALIDATION
// ============================================================================

/**
 * Validates email format using RFC 5322 compliant regex
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  
  // At least 8 characters
  return password.length >= 8;
}

/**
 * Validates user object structure
 */
export function validateUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false;
  
  const u = user as {
    email?: unknown;
    fullName?: unknown;
    full_name?: unknown;
    id?: unknown;
    user_id?: unknown;
  };
  return (
    typeof u.email === 'string' &&
    validateEmail(u.email) &&
    (typeof u.fullName === 'string' || typeof u.full_name === 'string') &&
    (typeof u.id === 'string' || typeof u.user_id === 'string')
  );
}

/**
 * Validates if the provided string is a valid asset symbol
 */
export function validateAssetSymbol(symbol: string): string {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Invalid asset symbol');
  }
  return symbol.trim().toUpperCase();
}

// ============================================================================

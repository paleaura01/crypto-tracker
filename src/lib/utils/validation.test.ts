/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest';
import { 
  validateField, 
  validateForm, 
  sanitizeNumber,
  isValidEthereumAddress,
  isValidBitcoinAddress,
  isValidSolanaAddress,
  validateAddressForChain
} from './validation';

describe('Validation Utilities', () => {
  describe('Address Validation', () => {
    it('should validate Ethereum addresses correctly', () => {
      const validEthAddress = '0x742d35Cc6bC5B5b5d7c7c7c7c7c7c7c7c7c7c7c7';
      const invalidEthAddress = '0x742d35Cc6bC5B5b5d7c7c7c7c7c7c7c7c7c7c7c'; // Too short
      
      expect(isValidEthereumAddress(validEthAddress)).toBe(true);
      expect(isValidEthereumAddress(invalidEthAddress)).toBe(false);
      expect(isValidEthereumAddress('')).toBe(false);
    });

    it('should validate Bitcoin addresses correctly', () => {
      const validBtcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      const invalidBtcAddress = 'invalid-btc-address';
      
      expect(isValidBitcoinAddress(validBtcAddress)).toBe(true);
      expect(isValidBitcoinAddress(invalidBtcAddress)).toBe(false);
      expect(isValidBitcoinAddress('')).toBe(false);
    });

    it('should validate Solana addresses correctly', () => {
      const validSolAddress = '11111111111111111111111111111112';
      const invalidSolAddress = 'invalid-sol-address';
      
      expect(isValidSolanaAddress(validSolAddress)).toBe(true);
      expect(isValidSolanaAddress(invalidSolAddress)).toBe(false);
      expect(isValidSolanaAddress('')).toBe(false);
    });

    it('should validate addresses for specific chains', () => {
      const ethAddress = '0x742d35Cc6bC5B5b5d7c7c7c7c7c7c7c7c7c7c7c7';
      const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      
      expect(validateAddressForChain(ethAddress, 'ethereum')).toBe(true);
      expect(validateAddressForChain(btcAddress, 'ethereum')).toBe(false);
      expect(validateAddressForChain(btcAddress, 'bitcoin')).toBe(true);
      expect(validateAddressForChain(ethAddress, 'bitcoin')).toBe(false);
    });
  });

  describe('Number Sanitization', () => {
    it('should sanitize numbers correctly', () => {
      expect(sanitizeNumber(42)).toBe(42);
      expect(sanitizeNumber('42.5')).toBe(42.5);
      expect(sanitizeNumber('invalid')).toBe(null);
      expect(sanitizeNumber(NaN)).toBe(null);
      expect(sanitizeNumber(Infinity)).toBe(null);
    });

    it('should respect min/max constraints', () => {
      expect(sanitizeNumber(5, { min: 10 })).toBe(null);
      expect(sanitizeNumber(15, { max: 10 })).toBe(null);
      expect(sanitizeNumber(5, { min: 0, max: 10 })).toBe(5);
    });

    it('should use default values', () => {
      expect(sanitizeNumber('invalid', { defaultValue: 0 })).toBe(0);
      expect(sanitizeNumber(null, { defaultValue: -1 })).toBe(-1);
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', () => {
      const result = validateField('', { required: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('required');
      
      const result2 = validateField('test', { required: true });
      expect(result2.isValid).toBe(true);
      expect(result2.error).toBe(null);
    });

    it('should validate string length', () => {
      const result1 = validateField('ab', { minLength: 3 });
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Minimum length');
      
      const result2 = validateField('abcdef', { maxLength: 5 });
      expect(result2.isValid).toBe(false);
      expect(result2.error).toContain('Maximum length');
      
      const result3 = validateField('abc', { minLength: 2, maxLength: 5 });
      expect(result3.isValid).toBe(true);
    });

    it('should validate patterns', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      const result1 = validateField('invalid-email', { pattern: emailPattern });
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('Invalid format');
      
      const result2 = validateField('test@example.com', { pattern: emailPattern });
      expect(result2.isValid).toBe(true);
    });    it('should handle custom validation', () => {
      const customRule = {
        custom: (value: unknown) => value === 'forbidden' ? 'This value is not allowed' : null
      };
      
      const result1 = validateField('forbidden', customRule);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('This value is not allowed');
      
      const result2 = validateField('allowed', customRule);
      expect(result2.isValid).toBe(true);
    });
  });

  describe('Form Object Validation', () => {
    it('should validate multiple fields', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        age: '25'
      };
      
      const rules = {
        name: { required: true, minLength: 2 },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { required: true }
      };
      
      const result = validateForm(data, rules);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should collect all validation errors', () => {
      const data = {
        name: '',
        email: 'invalid-email',
        age: ''
      };
      
      const rules = {
        name: { required: true },
        email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        age: { required: true }
      };
      
      const result = validateForm(data, rules);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(3);
      expect(result.errors.name).toContain('required');
      expect(result.errors.email).toContain('Invalid format');
      expect(result.errors.age).toContain('required');
    });
  });
});

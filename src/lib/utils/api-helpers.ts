// API utility functions and helpers
import type { ApiResponse, ErrorDetails } from '../types/index.js';

// HTTP request helpers
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Response creation helpers
export function createApiResponse<T>(
  data: T,
  success: boolean = true,
  error?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    data,
    success,
    timestamp: Date.now()
  };
  
  if (error) {
    response.error = error;
  }
  
  return response;
}

export function createErrorResponse<T>(
  error: string | ErrorDetails
): ApiResponse<T> {
  const errorMessage: string = typeof error === 'string' 
    ? error
    : error.message;
    
  return {
    success: false,
    data: null as unknown as T,
    error: errorMessage,
    timestamp: Date.now()
  };
}

// Request validation helpers
export function validateRequiredFields<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): ErrorDetails[] {
  const errors: ErrorDetails[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || data[field] === '') {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Required field '${String(field)}' is missing or empty`,
        field: String(field)
      });
    }
  }
  
  return errors;
}

export function validateAddress(address: string, chain?: string): boolean {
  // Basic validation - could be enhanced based on chain type
  if (!address || address.length < 20) return false;
  
  // Ethereum-style addresses
  if (chain === 'ethereum' || chain === 'polygon') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  // Bitcoin addresses (simplified)
  if (chain === 'bitcoin') {
    return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
  }
  
  // Solana addresses
  if (chain === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  
  // Generic validation
  return address.length >= 20 && address.length <= 100;
}

// Error handling utilities
export function handleApiError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    const errorDetails: ErrorDetails = {
      code: 'API_ERROR',
      message: error.message
    };
    
    if (error.stack) {
      errorDetails.details = { stack: error.stack };
    }
    
    return errorDetails;
  }
  
  if (typeof error === 'string') {
    return {
      code: 'API_ERROR',
      message: error
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred'
  };
}

// Rate limiting helpers
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Simple cache implementation
export class SimpleCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  
  constructor(private ttlMs: number = 300000) {} // 5 minutes default
  
  set(key: string, value: T): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }
  
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
    clear(): void {
    this.cache.clear();
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  size(): number {
    // Clean expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttlMs) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

// Retry utility function
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delay?: number } | number = 3
): Promise<T> {
  const { maxRetries, delayMs } = typeof options === 'number' 
    ? { maxRetries: options, delayMs: 1000 }
    : { maxRetries: options.maxRetries || 3, delayMs: options.delay || 1000 };
    
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }
  
  throw lastError!;
}

// Type guards
export function isValidHttpMethod(method: string): method is 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' {
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

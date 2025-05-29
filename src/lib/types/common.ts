// Common utility types used across the application
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type UnixTimestamp = number;
export type UUID = string;

// Generic response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: UnixTimestamp;
  success: boolean;
}

// Status types commonly used
export type Status = 'active' | 'inactive' | 'pending' | 'deleted' | 'archived';

// Currency and financial types
export type CurrencyCode = string; // ISO 4217 currency codes like 'USD', 'EUR'
export type DecimalString = string; // String representation of decimal numbers for precision

// Pagination support
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

// Error handling
export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// Date/time utilities
export interface TimestampFields {
  created_at: string;
  updated_at: string;
}

// Data formatting and display utilities
import type { DecimalString, CurrencyCode } from '../types/index.js';

// Number formatting utilities
export function formatCurrency(
  amount: number | string, 
  currency: CurrencyCode = 'USD',
  locale: string = 'en-US'
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount);
}

export function formatNumber(
  amount: number | string,
  options: {
    decimals?: number;
    locale?: string;
    compact?: boolean;
  } = {}
): string {
  const { decimals = 2, locale = 'en-US', compact = false } = options;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  const formatOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };

  if (compact) {
    formatOptions.notation = 'compact';
    formatOptions.compactDisplay = 'short';
  }

  return new Intl.NumberFormat(locale, formatOptions).format(numAmount);
}

export function formatPercentage(
  value: number,
  options: {
    decimals?: number;
    showSign?: boolean;
  } = {}
): string {
  const { decimals = 2, showSign = true } = options;
  const formatted = (value * 100).toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

// Crypto-specific formatting
export function formatCryptoAmount(
  amount: DecimalString,
  symbol: string,
  options: {
    decimals?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const { decimals = 6, showSymbol = true } = options;
  const numAmount = parseFloat(amount);
  
  // Use appropriate decimal places based on amount size
  let displayDecimals = decimals;
  if (numAmount > 1000) displayDecimals = 2;
  else if (numAmount > 1) displayDecimals = 4;
  
  const formatted = formatNumber(numAmount, { decimals: displayDecimals });
  return showSymbol ? `${formatted} ${symbol}` : formatted;
}

export function formatAddress(
  address: string,
  options: {
    start?: number;
    end?: number;
    separator?: string;
  } = {}
): string {
  const { start = 6, end = 4, separator = '...' } = options;
  
  if (address.length <= start + end) {
    return address;
  }
  
  return `${address.slice(0, start)}${separator}${address.slice(-end)}`;
}

// Time formatting utilities
export function formatTimeAgo(timestamp: string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export function formatDateTime(
  timestamp: string | number,
  options: {
    locale?: string;
    includeTime?: boolean;
    includeSeconds?: boolean;
  } = {}
): string {
  const { locale = 'en-US', includeTime = true, includeSeconds = false } = options;
  const date = new Date(timestamp);
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    if (includeSeconds) {
      dateOptions.second = '2-digit';
    }
  }
  
  return new Intl.DateTimeFormat(locale, dateOptions).format(date);
}

// Data size formatting
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// Color utilities for UI
export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-600';
}

export function getPnLColorClass(value: number): string {
  if (value > 0) return 'text-green-600 bg-green-50';
  if (value < 0) return 'text-red-600 bg-red-50';
  return 'text-gray-600 bg-gray-50';
}

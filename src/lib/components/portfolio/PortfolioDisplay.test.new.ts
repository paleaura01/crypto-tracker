/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import PortfolioDisplay from './PortfolioDisplay.svelte';

// Mock data for testing that matches actual component props
const mockPortfolio = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    balance: 1.5,
    price: 30000,
    value: 45000,
    contractAddress: 'native',
    chain: 'bitcoin'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    balance: 10,
    price: 3000,
    value: 30000,
    contractAddress: '0x0000000000000000000000000000000000000000',
    chain: 'ethereum'
  }
];

describe('PortfolioDisplay Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty state when no portfolio items', () => {
    render(PortfolioDisplay, {
      props: {
        portfolio: [],
        loading: false,
        error: ''
      }
    });

    expect(screen.getByText(/no tokens found/i)).toBeInTheDocument();
  });

  it('should render loading state', () => {
    render(PortfolioDisplay, {
      props: {
        portfolio: [],
        loading: true,
        error: ''
      }
    });

    expect(screen.getByText(/loading portfolio data/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    const errorMessage = 'Failed to load portfolio';
    
    render(PortfolioDisplay, {
      props: {
        portfolio: [],
        loading: false,
        error: errorMessage
      }
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render portfolio items', () => {
    render(PortfolioDisplay, {
      props: {
        portfolio: mockPortfolio,
        loading: false,
        error: ''
      }
    });

    // Check if portfolio items are rendered
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
  });

  it('should have search functionality', () => {
    render(PortfolioDisplay, {
      props: {
        portfolio: mockPortfolio,
        loading: false,
        error: ''
      }
    });

    const searchInput = screen.getByLabelText(/search tokens/i);
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('id', 'token-search');
  });

  it('should respect accessibility requirements', () => {
    render(PortfolioDisplay, {
      props: {
        portfolio: mockPortfolio,
        loading: false,
        error: ''
      }
    });

    // Search input should have proper label
    const searchInput = screen.getByLabelText(/search tokens/i);
    expect(searchInput).toBeInTheDocument();

    // Test error state accessibility
    const { unmount } = render(PortfolioDisplay, {
      props: {
        portfolio: [],
        loading: false,
        error: 'Test error'
      }
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    unmount();
  });
});

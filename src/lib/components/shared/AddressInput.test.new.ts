/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AddressInput from './AddressInput.svelte';

describe('AddressInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default props', () => {
    render(AddressInput);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Enter wallet address (0x...)');
  });

  it('should display initial value', () => {
    render(AddressInput, {
      props: {
        address: '0x742b15b5b5d9d7d8b7d8b7d8b7d8b7d8b7d8b7d8'
      }
    });

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('0x742b15b5b5d9d7d8b7d8b7d8b7d8b7d8b7d8b7d8');
  });

  it('should handle disabled state', () => {
    render(AddressInput, {
      props: {
        disabled: true
      }
    });

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should show error message when provided', () => {
    const errorMessage = 'Invalid address format';
    
    render(AddressInput, {
      props: {
        error: errorMessage
      }
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(AddressInput, {
      props: {
        loading: true
      }
    });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

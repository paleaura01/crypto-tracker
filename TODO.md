# Project Task List

This document outlines the remaining tasks and priorities to complete Phase 4 and prepare the project for further optimization.

## 1. TypeScript Type Fixes

- [ ] Add missing type exports:
  - Auth types (`AuthRequest`, `AuthResponse`, `RegisterRequest`, `AuthSession`, `UserProfile`) in `src/lib/types/auth.ts`
  - Price-related types (`CryptoPrice`, `PriceHistoryEntry`, `MarketData`) in `src/lib/types/blockchain.ts`
  - API wrapper types (`PriceRequest`, `PriceResponse`) in `src/lib/types/api.ts`
- [ ] Update central `index.ts` to re-export any new types if necessary.
- [ ] Run `tsc --noEmit` and resolve all remaining compiler errors.

## 2. Test Suite Mocks & Fixes

- [ ] Complete Supabase mocks with full shape:
  - `signUp`, `signInWithPassword` should resolve with full `Session` and `User` objects.
  - `getSession`, `getUser` mocks must include all required fields.
- [ ] Verify and fix 3 failing AuthService tests (`register`, `getCurrentSession`, `getUserProfile`).
- [ ] Remove or update outdated test files (`PortfolioDisplay.test.old.ts`).
- [ ] Ensure coverage thresholds are met.

## 3. Component Cleanup & Consolidation

- [ ] Remove duplicate components in `src/routes/portfolio/components`:
  - Consolidate `EVMAddressBalances` and `EVMAddressBalancesRefactored`.
- [ ] Clean up `src/lib/components/portfolio`:
  - Remove unused files or merge overlapping components.
  - Delete `PortfolioDisplay.test.old.ts`.
- [ ] Refactor `PortfolioDisplay.svelte` for accessibility and remove unused types.
- [ ] Refactor `AddressInput.svelte` to remove unused declarations and ensure proper label associations.

## 4. Linting & Unused Code

- [ ] Run ESLint/TSLint across project and fix:
  - Unused imports, variables, and functions.
  - Correct `export` vs `export type` usage.
- [ ] Remove any dead code or duplicate utilities.

## 5. Accessibility & UX Improvements

- [ ] Ensure form inputs have associated `<label>` elements.
- [ ] Add ARIA attributes where necessary.
- [ ] Validate keyboard navigation and focus states.

## 6. Phase 1: Performance Optimizations (Next Steps)

- [ ] Implement dynamic imports and code splitting for large modules.
- [ ] Optimize API calls and caching strategies.
- [ ] Minimize bundle size (target ≥60% reduction).
- [ ] Add performance monitoring and profiling.

---

*Once TypeScript errors and test failures are resolved, we can proceed with implementation of Phase 1 optimizations.*

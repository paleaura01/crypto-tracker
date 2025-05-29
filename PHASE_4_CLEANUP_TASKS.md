# Phase 4: TypeScript Architecture Cleanup Tasks

## Current Status: In Progress
**Date Created**: May 28, 2025  
**Objective**: Fix all TypeScript errors, clean up filesystem structure, complete test suite, and prepare for optimization implementation.

---

## 🎯 HIGH PRIORITY TASKS

### 1. Type System Fixes
- [x] **Add missing Auth types** - Added AuthRequest, AuthResponse, RegisterRequest, AuthSession, UserProfile to `auth.ts`
- [x] **Add missing Price types** - Added CryptoPrice, PriceHistoryEntry, MarketData to `blockchain.ts`
- [x] **Add missing API types** - Added PriceRequest, PriceResponse to `api.ts`
- [ ] **Fix Supabase test mocks** - Create complete User/Session objects in auth-service.test.ts
- [ ] **Fix type export statements** - Change `export` to `export type` where required by verbatimModuleSyntax
- [ ] **Resolve remaining TypeScript errors** - Address all 50+ remaining compilation issues

### 2. Test Suite Fixes
- [x] **Basic tests passing** (22/25 tests)
- [ ] **Fix AuthService register test** - Incomplete Supabase User object mock
- [ ] **Fix AuthService getCurrentSession test** - Incomplete Session object mock  
- [ ] **Fix AuthService getUserProfile test** - Incomplete User object mock
- [ ] **Fix component tests** - Re-enable 9 skipped component tests
- [ ] **Add coverage reporting** - User manually added @vitest/coverage-v8

### 3. Filesystem Cleanup
- [ ] **Remove duplicate portfolio components**:
  - `src/routes/portfolio/components/EVMAddressBalances.svelte` (duplicate)
  - `src/routes/portfolio/components/EVMAddressBalancesRefactored.svelte` (duplicate)
  - Keep: `src/lib/components/portfolio/PortfolioDisplay.svelte` (main)
- [ ] **Consolidate component architecture** - Move route-specific components to proper lib structure
- [ ] **Remove unused imports/variables** - Clean up across all files
- [ ] **Fix file organization** - Ensure consistent import paths and structure

### 4. Accessibility Fixes
- [ ] **Fix form label associations** - Address form inputs without proper labels
- [ ] **Add missing ARIA attributes** - Improve screen reader support
- [ ] **Test keyboard navigation** - Ensure all interactive elements are accessible

---

## 🔧 TECHNICAL DEBT RESOLUTION

### Code Quality Issues
- [ ] **Unused import cleanup** in multiple files:
  - `AddressInput.svelte` - Remove unused type declarations
  - `PortfolioDisplay.svelte` - Clean up unused imports
  - Various service files - Remove dead code
- [ ] **Type safety improvements**:
  - Add proper type guards
  - Fix any type usage
  - Strengthen interface contracts

### Configuration Updates
- [x] **Vitest config enhanced** - Added jsdom environment and timeouts
- [ ] **ESLint rule updates** - Address accessibility and type-related warnings
- [ ] **TypeScript strict mode** - Ensure all strict type checking passes

---

## 📁 FILE-SPECIFIC TASKS

### Services Layer
| File | Status | Issues | Actions Needed |
|------|--------|--------|----------------|
| `auth-service.ts` | ⚠️ Partial | Missing type exports | ✅ Types added, test mocks pending |
| `price-service.ts` | ⚠️ Partial | Missing type exports | ✅ Types added |
| `auth-service.test.ts` | ❌ Failing | Incomplete Supabase mocks | Fix User/Session object structure |
| `portfolio-service.ts` | ⚠️ Review | Potential unused imports | Clean up imports |
| `wallet-service.ts` | ⚠️ Review | Type safety | Review and strengthen types |

### Components Layer
| File | Status | Issues | Actions Needed |
|------|--------|--------|----------------|
| `PortfolioDisplay.svelte` | ⚠️ Skipped | Accessibility + unused types | Fix labels, clean imports |
| `AddressInput.svelte` | ⚠️ Skipped | Unused declarations | Remove unused code |
| `EVMAddressBalances.svelte` (routes) | ❌ Duplicate | Structural duplication | Remove duplicate |
| `EVMAddressBalancesRefactored.svelte` | ❌ Duplicate | Structural duplication | Remove duplicate |

### Types Layer
| File | Status | Issues | Actions Needed |
|------|--------|--------|----------------|
| `auth.ts` | ✅ Fixed | Missing exports | ✅ Added all required types |
| `blockchain.ts` | ✅ Fixed | Missing price types | ✅ Added CryptoPrice, etc. |
| `api.ts` | ✅ Fixed | Missing request/response types | ✅ Added missing types |
| `portfolio.ts` | ⚠️ Review | Potential issues | Review for completeness |

---

## 🧪 TESTING STRATEGY

### Current Test Results
```
✅ Passing: 22 tests
❌ Failing: 3 tests (AuthService register, getCurrentSession, getUserProfile)
⏭️ Skipped: 9 tests (Component tests)
```

### Test Fixes Required
1. **Create complete Supabase mock objects**:
   ```typescript
   const completeUser = {
     id: '123',
     email: 'test@example.com',
     aud: 'authenticated',
     role: 'authenticated',
     email_confirmed_at: '2024-01-01T00:00:00Z',
     created_at: '2024-01-01T00:00:00Z',
     updated_at: '2024-01-01T00:00:00Z',
     // ... all required Supabase User properties
   };
   ```

2. **Fix Session object structure**:
   ```typescript
   const completeSession = {
     access_token: 'token',
     refresh_token: 'refresh',
     expires_in: 3600,
     expires_at: Date.now() + 3600000,
     token_type: 'bearer',
     user: completeUser
   };
   ```

### Test Coverage Goals
- **Target**: 80%+ code coverage
- **Focus Areas**: Critical paths in auth, portfolio, price services
- **Component Testing**: Re-enable and fix all component tests

---

## 🚀 OPTIMIZATION PREPARATION

### Bundle Analysis Setup
- [ ] **Install bundle analyzer** - Add webpack-bundle-analyzer or similar
- [ ] **Create baseline metrics** - Document current bundle sizes
- [ ] **Identify optimization targets** - Heavy dependencies, unused code

### Performance Monitoring Setup
- [ ] **Add performance marks** - Critical rendering paths
- [ ] **Setup monitoring** - Web Vitals tracking
- [ ] **Create performance budget** - Define acceptable thresholds

---

## 📊 SUCCESS CRITERIA

### Phase 4 Completion Checklist
- [ ] **Zero TypeScript errors** - All compilation issues resolved
- [ ] **All tests passing** - 25/25 tests green
- [ ] **Clean file structure** - No duplicate components
- [ ] **Accessibility compliance** - No accessibility warnings
- [ ] **Performance baseline** - Current metrics documented
- [ ] **Code quality** - ESLint passing, no unused code

### Ready for Phase 5 (Optimization Implementation)
- [ ] **Clean codebase** - All technical debt addressed
- [ ] **Stable test suite** - Reliable CI/CD pipeline
- [ ] **Documented baseline** - Performance and bundle metrics
- [ ] **Optimization roadmap** - Phase 1 tasks prioritized

---

## 🔄 NEXT STEPS

1. **Immediate**: Fix Supabase test mocks for AuthService
2. **Short-term**: Clean up duplicate components and unused imports
3. **Medium-term**: Address all TypeScript errors and accessibility issues
4. **Final**: Validate all tests pass and document completion

---

## 📝 NOTES

- **Dependencies**: User manually added `@vitest/coverage-v8` to package.json
- **Test Environment**: jsdom configured for component testing
- **Architecture**: Preparing for comprehensive optimization implementation
- **Documentation**: PHASE_4_FINAL_EVALUATION.md contains optimization roadmap

**Last Updated**: May 28, 2025  
**Next Review**: After fixing Supabase test mocks

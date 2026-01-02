# Widget-Chat Test Suite

## Phase 0: Pre-Refactoring Validation

This test suite validates the current behavior of `widget-chat/index.ts` before any refactoring. All tests must pass before AND after each extraction step.

## Test Structure

```
__tests__/
├── types.ts              # Type definitions for request/response schemas
├── fixtures.ts           # Mock data and test fixtures
├── test-utils.ts         # Helper functions for requests and assertions
├── snapshot.test.ts      # 44 snapshot tests (Phase 0.1)
├── integration.test.ts   # 8 integration tests (Phase 0.2)
├── baseline-metrics.ts   # Performance baseline capture (Phase 0.3)
└── README.md             # This file
```

## Quick Start

### Environment Setup

Set these environment variables before running tests:

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export TEST_AGENT_ID="your-test-agent-uuid"  # An agent with properties/calendar configured
```

### Running Tests

**Snapshot Tests (Phase 0.1):**
```bash
deno test --allow-all supabase/functions/widget-chat/__tests__/snapshot.test.ts
```

**Integration Tests (Phase 0.2):**
```bash
deno test --allow-all supabase/functions/widget-chat/__tests__/integration.test.ts
```

**Performance Baseline (Phase 0.3):**
```bash
deno run --allow-all supabase/functions/widget-chat/__tests__/baseline-metrics.ts
```

**All Tests:**
```bash
deno test --allow-all supabase/functions/widget-chat/__tests__/
```

## Test Categories

### Phase 0.1: Snapshot Tests (44 tests)

| ID Range | Category | Count |
|----------|----------|-------|
| SNAP-001 to SNAP-015 | Core Functionality | 15 |
| SNAP-016 to SNAP-030 | Advanced Features | 15 |
| SNAP-031 to SNAP-044 | Error Handling & Edge Cases | 14 |

**Priority Distribution:**
- Critical: 13 tests
- High: 17 tests
- Medium: 12 tests
- Low: 2 tests

### Phase 0.2: Integration Tests (8 tests)

| ID | Test Case |
|----|-----------|
| INT-001 | Full greeting flow |
| INT-002 | Full property search flow |
| INT-003 | Full booking flow (day → time → confirm) |
| INT-004 | Multi-turn conversation state |
| INT-005 | Lead capture flow |
| INT-006 | Memory persistence |
| INT-007 | Cache warming |
| INT-008 | Usage metrics increment |

### Phase 0.3: Performance Baseline

Captures:
- Cold start time
- Warm request (cache miss) - average and P95
- Warm request (cache hit) - average and P95
- Bundle size (manual check in dashboard)

## Skipping Tests

To skip live API tests:
```bash
export SKIP_LIVE_TESTS=true
```

To skip integration tests:
```bash
export SKIP_INTEGRATION_TESTS=true
```

## Validation Checklist

Before proceeding to Phase 1 (extraction), verify:

- [ ] All 44 snapshot tests pass
- [ ] All 8 integration tests pass
- [ ] Baseline metrics captured and saved
- [ ] No console errors during test runs
- [ ] Response times within acceptable ranges

## After Each Extraction

1. Run all tests
2. Compare performance against baseline
3. Any test failure = rollback
4. Performance degradation >20% = investigate

## Notes

- Some tests require specific agent configuration (calendar, properties)
- Rate limit tests require many requests - run manually
- Custom tool tests require agent with configured tools
- Memory tests require lead tracking to persist across conversations

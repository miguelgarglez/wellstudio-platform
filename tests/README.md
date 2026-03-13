# Testing Conventions

## Current layout

- `tests/unit`: domain and module-level tests that run in Node via Vitest
- `tests/e2e`: reserved for Playwright tests
- `tests/fixtures`: shared in-memory builders for auth and domain entities

## Rule of thumb

- prefer unit tests for pure business rules
- keep tests close to module boundaries conceptually, even if they live under `tests/`
- avoid testing simple presentation-only code unless it carries real behavior

## E2E baseline

- Playwright owns smoke coverage for route availability and critical user flows
- the initial smoke suite should stay intentionally small and fast
- browser artifacts should live under `output/playwright/`

## Fixture strategy

- shared defaults should live in `tests/fixtures`
- unit tests should prefer builders over hand-written object casts
- integration tests can reuse fixture defaults, but persistence belongs to a separate layer

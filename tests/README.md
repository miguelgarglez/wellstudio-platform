# Testing Conventions

## Current layout

- `tests/unit`: domain and module-level tests that run in Node via Vitest
- `tests/e2e`: reserved for Playwright tests

## Rule of thumb

- prefer unit tests for pure business rules
- keep tests close to module boundaries conceptually, even if they live under `tests/`
- avoid testing simple presentation-only code unless it carries real behavior

---
name: frontend
description: Reusable frontend patterns for Next.js React projects — covering server actions (next-safe-action), forms, error handling, service architecture, state management, HTTP, validation, testing, and configuration conventions
---

# Frontend Patterns

Reusable frontend patterns for Next.js React projects, using next-safe-action for typed server mutations. These skills cover patterns used across ecommerce applications, including both server-side Next.js apps (database-backed) and client-side apps (external HTTP API-based).

## Skills

### [Constants Configuration Pattern](./constants-configuration-pattern/SKILL.md)
Centralize all environment variables (via `@t3-oss/env-nextjs`) and API endpoint constants in `constants/`. Server actions replace the need for internal API endpoint constants.

### [Factory Method Pattern](./factory-method-pattern/SKILL.md)
Three variations: next-safe-action server actions (recommended for Next.js), traditional server factories, and HTTP-based factories for external APIs. Types always come from `models/`.

### [Form Handling](./form-handling/SKILL.md)
Five-step form pattern with next-safe-action integration: Zod schema → server action → `formOptions` → `useForm` with `validators` → `form.Field` render prop → server action submission with result handling.

### [Error Handling](./error-handling/SKILL.md)
Three-tier error propagation in Next.js: DB layer rejection → next-safe-action validation errors (`result.validationErrors`, `result.serverError`) → component-level toast with sonner. Plus Next.js `error.tsx` boundaries.

### [Functional Dependency Injection](./functional-dependency-injection/SKILL.md)
Dependency injection through function parameters: next-safe-action factories with injected db, traditional server factories, and URL + HTTP function DI for external APIs.

### [HTTP Client Abstraction](./http-client-abstraction/SKILL.md)
Direct `fetch` calls for external/third-party APIs only. Your own server operations use next-safe-action instead of HTTP calls. No generic HTTP wrapper layer.

### [React Query Cache Utilities](./react-query-cache-utilities/SKILL.md)
Cache-first data fetching with `@tanstack/react-query`, combined with next-safe-action for typed mutations — query keys enum, cache invalidation on action success, and cache-as-request fallback.

### [Service Architecture](./service-architecture/SKILL.md)
Domain service patterns: Next.js apps use next-safe-action → DB layer → composition. External API clients use HTTP implementation → factory → wiring. All types from `models/`.

### [Service Layer Composition](./service-layer-composition/SKILL.md)
How services are wired: next-safe-action actions are self-contained (no wiring needed), external API clients compose in the domain `index.ts`. Barrel export conventions for clean imports.

### [Type Contract Architecture](./type-contract-architecture/SKILL.md)
Type contracts that define operation signatures per domain. next-safe-action uses Zod schemas (types inferred), traditional factories use plain names (`CreateProduct`), external API clients use `Http{Verb}{Noun}`.

### [Unit Testing](./unit-testing/SKILL.md)
Three-layer testing: server action tests with mocked DB (assert `result.data`, `result.validationErrors`), pure unit tests for factory functions with mocked dependencies, and HTTP implementation tests with mocked `fetch`.

### [Zod Schema Validation](./zod-schema-validation/SKILL.md)
Zod schemas for runtime validation at three levels: next-safe-action input validation (automatic), cross-field validation with `superRefine`, and external API response validation via `getValidationResult`.

### [Zustand State Management](./zustand-state-management/SKILL.md)
Global state management with Zustand — one store per domain, selector-based subscriptions, `undefined`/`null` tri-state convention, hydration from Next.js server components via client component wrappers.

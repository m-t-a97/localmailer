---
name: http-client-abstraction
description: Use raw fetch directly in domain-specific HTTP implementations for third-party APIs — use next-safe-action for your own Next.js server operations
---

# HTTP Client Abstraction

The HTTP client pattern is used **only for third-party/external APIs**. In Next.js, your own server operations use `next-safe-action` server actions instead of client-side HTTP calls.

## Architecture Decision

| Scenario | Pattern | Why |
|----------|---------|-----|
| Your own API (mutations/queries) | `next-safe-action` | Typed, validated, no HTTP boilerplate |
| Third-party external APIs | `fetch` in `http-*.service.ts` | Direct HTTP to external services |

## Client-side: Direct `fetch` Pattern (External APIs Only)

For external third-party APIs, use raw `fetch` directly in each `http-{domain}.service.ts` file. There is no generic HTTP wrapper layer — each implementation calls `fetch` with the appropriate method, headers, and body.

## Folder Structure

```
src/services/
├── products/
│   ├── products.service.ts         ← Factory functions
│   ├── http-products.service.ts    ← Domain-specific HTTP implementations (fetch) — external APIs only
│   └── products.service.test.ts
├── orders/
│   ├── orders.service.ts
│   ├── http-orders.service.ts
│   └── orders.service.test.ts
└── ...
```

## Domain-Specific HTTP Implementations (External APIs)

Each domain has an `http-{domain}.service.ts` file. These files:
- Use `fetch` directly (no generic wrappers)
- Are explicitly typed with type contracts from `models/`
- Validate response bodies using Zod schemas via a validation result utility

### ✅ DO — Thin fetch-based wrappers with validation:

```typescript
// services/products/http-products.service.ts
import { validateHttpCreateProduct, type HttpCreateProduct } from "@/models";

export const httpCreateProduct: HttpCreateProduct = async (url, body) => {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const validationResult = validateHttpCreateProduct(data);
  if (!validationResult.success) {
    throw new Error(validationResult.error);
  }
  return validationResult.value;
};
```

### ❌ DON'T — Put business logic in HTTP implementations:
```typescript
// NEVER do this — logic belongs in the factory layer
export const httpCreateProduct: HttpCreateProduct = async (url, body) => {
  const data = await fetch(url, { ... }).then(r => r.json());
  if (data.name.length < 3) {
    throw new Error("Name too short");
  }
  return data;
};
```

## next-safe-action: For Your Own Server Operations

Instead of creating HTTP implementations for your own Next.js server, use next-safe-action:

### ❌ DON'T — Old pattern (building HTTP calls to your own API):
```typescript
// ❌ DON'T — Use fetch to call your own Next.js API route
export const httpCreateProduct: HttpCreateProduct = async (url, body) => {
  const response = await fetch(url, { method: "POST", body: JSON.stringify(body) });
  // ...
};
```

### ✅ DO — Use next-safe-action server actions:
```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export const createProductAction = action(createProductSchema, async (input) => {
  // Direct DB access — no HTTP call needed
  const [product] = await db.insert(productsTable).values(input).returning();
  return product;
});
```

Used on the client:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";

function ProductForm() {
  const { execute, result } = useAction(createProductAction);
  // execute(input) — typed, validated, no fetch boilerplate
}
```

This eliminates the need for:
- HTTP implementation files for your own API
- API endpoint constants for your own routes
- Response validation (next-safe-action handles it)
- Manual error handling (errors are typed and returned)

## When to Use `fetch` vs next-safe-action

| Criteria | Use `fetch` | Use next-safe-action |
|----------|-------------|---------------------|
| Target | External/third-party API | Your own Next.js server |
| Validation | Manual with Zod | Automatic via `action(schema, handler)` |
| Error handling | `throw new Error()` | Typed `serverError` / `validationErrors` |
| Type safety | Manual types | Inferred from schema |
| Auth | API keys, OAuth | Next.js middleware / action middleware |

## URL Construction Conventions (for external APIs)

```typescript
// ✅ DO — Append params as URL segments
`${url}/${productId}/images`

// ✅ DO — Append query strings
`${url}?category=${category}`
```

## Rules

### ✅ DO
- Use `fetch` only for external/third-party APIs
- Type domain HTTP implementations with contract types from `models/`
- Validate response bodies with Zod schemas
- Use consistent error handling: `throw new Error(...)` on non-ok responses
- Use next-safe-action for all your own server mutations

### ❌ DON'T
- Don't use `fetch` to call your own Next.js API — use server actions
- Don't put validation or business logic in HTTP implementations
- Don't create generic HTTP wrapper layers
- Don't catch errors in HTTP implementations — let them propagate
- Don't create API routes for your own mutations if server actions suffice

---
name: factory-method-pattern
description: Implement the functional factory method pattern used across all service layers — now with next-safe-action for server-side mutations in Next.js
---

# Factory Method Pattern

This pattern uses a pure functional factory method pattern for ALL service layers. Every API operation, every mutation, every query is created via a **factory function** that takes dependencies as parameters and returns a **handler closure**.

This is NOT the Gang of Four class-based factory. This is a functional TypeScript pattern where factories are exported standalone functions that return closures.

Types are NEVER defined in service files. All types come from the project's `models/` folder. See the **[type-contract-architecture](../type-contract-architecture/SKILL.md)** skill.

## Three Variations

The pattern has three variations depending on the app context in Next.js:

### Variation A: Server-side (Database-backed) via next-safe-action

In Next.js, server-side mutations use `next-safe-action` directly. The action IS the factory:

```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";
import { z } from "zod";
import { db } from "@/db";
import { productsTable } from "@/db/schema";

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
});

export const createProductAction = action(
  createProductSchema,
  async (input) => {
    const [product] = await db.insert(productsTable).values(input).returning();
    return product;
  },
);

// The type is inferred — no separate factory type needed
// Client receives typed data, validationErrors, or serverError
```

For complex server actions that need dependency injection, use factory functions:

```typescript
// actions/products.ts
"use server";

export const createProductActionFactory = (
  db: DB,
  schema: z.ZodSchema<ProductCreateInput>,
) => {
  return action(schema, async (input) => {
    const [product] = await db.insert(productsTable).values(input).returning();
    return product;
  });
};
```

### Variation B: Server-side (Database-backed, traditional factory)

For non-action server-side operations (called from within other server code):

```typescript
// services/products/products.service.ts
import type { CreateProduct, ProductCreateInput } from "@/models";

export const createProductFactory = (createProduct: CreateProduct) => {
  return async (
    input: ProductCreateInput,
  ): Promise<Awaited<ReturnType<CreateProduct>>> => createProduct(input);
};

export type CreateProduct = ReturnType<typeof createProductFactory>;
```

The dependency is a function that matches the type contract from `models/`. In the composition layer, these are wired to database implementations.

### Variation C: Client-side (HTTP API for external services)

For calls to third-party APIs (not your own server), use URL + HTTP function DI:

```typescript
// services/products/products.service.ts
import type { CreateProductInput, Product } from "@shared";
import type { HttpCreateProduct } from "@/models";

export const createProductFactory = (
  url: string,
  httpCreateProduct: HttpCreateProduct,
) => {
  return async (data: CreateProductInput): Promise<Product> => {
    const response = await httpCreateProduct(url, data);
    return response.data;
  };
};
```

## When to Use What in Next.js

| Scenario | Pattern | Why |
|----------|---------|-----|
| Mutations (create, update, delete) | next-safe-action `action()` | Typed, validated, no manual HTTP |
| Reading data in server components | Direct DB call or server action | No client-side cache needed |
| Interactive client data fetching | React Query + server action | Caching, refetching, loading states |
| External API calls | Factory + HTTP DI | Third-party, not your server |

## Naming Rules

| Pattern | Example |
|---------|---------|
| next-safe-action | `createProductAction`, `getProductsAction` |
| Server factory | `createProductFactory`, `getProductByIdFactory` |
| Client factory | `createProductFactory` (with URL + HTTP fn) |
| File (actions) | `actions/products.ts` |
| File (services) | `services/products/products.service.ts` |

## Service Export Convention

For traditional service factories, the final wired service MUST be exported from the domain's `index.ts`:

```typescript
// services/products/index.ts
export { productService } from "./products.composition";
export type { CreateProduct } from "./products.service";
```

For next-safe-action actions, export directly from the action file:

```typescript
// app/_actions/products.ts  or  actions/products.ts
export const createProductAction = action(schema, handler);
// Imported as: import { createProductAction } from "@/actions/products";
```

Call sites then import the action:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";

function ProductForm() {
  const { execute, result } = useAction(createProductAction);
  // ...
}
```

## Rules

### ✅ DO
- Use next-safe-action for all server mutations in Next.js
- Use traditional factory pattern for external API calls or non-action server operations
- Define types in `models/` — never in service or action files
- Use `action(schema, handler)` directly — no wiring needed
- Export action types by importing the action and using `typeof`

### ❌ DON'T
- Don't use classes for services
- Don't define types in service files — they go in `models/`
- Don't create API routes for your own mutations — use server actions
- Don't wrap server actions in additional layers — they ARE the service layer

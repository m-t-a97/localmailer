---
name: service-layer-composition
description: Wire factories to implementations at a single composition point — server actions for Next.js, external API clients in the domain index.ts
---

# Service Layer Composition

This pattern uses factory functions for all operations. The composition layer is where factories are wired to their concrete implementations. In Next.js, the composition pattern differs based on whether the target is your own server (use server actions) or external APIs.

## Composition in Next.js

### With next-safe-action (Recommended for your own server)

Server actions ARE the composition — no separate wiring needed:

```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";
import { z } from "zod";
import { db } from "@/db";
import { productsTable } from "@/db/schema";

const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export const createProductAction = action(createProductSchema, async (input) => {
  const [product] = await db.insert(productsTable).values(input).returning();
  return product;
});

export const getProductsAction = action(z.void(), async () => {
  return await db.select().from(productsTable);
});
```

For actions that need injected dependencies (e.g., different DB for testing):

```typescript
// actions/products.ts
"use server";

export const createProductActionFactory = (db: DB) => {
  return action(createProductSchema, async (input) => {
    const [product] = await db.insert(productsTable).values(input).returning();
    return product;
  });
};

// actions/index.ts — composition root
import { db } from "@/db";
import { createProductActionFactory } from "./products";

export const createProductAction = createProductActionFactory(db);
```

Call sites import the already-wired action:

```typescript
// app/products/page.tsx (server component)
import { getProductsAction } from "@/actions/products";

export default async function ProductsPage() {
  const result = await getProductsAction();
  return <ProductsList products={result?.data ?? []} />;
}
```

```typescript
// components/CreateProductForm.tsx (client component)
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";

export function CreateProductForm() {
  const { execute, status } = useAction(createProductAction);
  // ...
}
```

### With traditional factories (for external APIs)

For third-party API calls:

```
┌────────────────────────────────────────────────┐
│  1. models/{domain}.ts                         │
│     Type contracts (HTTP function signatures)  │
├────────────────────────────────────────────────┤
│  2. services/{domain}/http-{domain}.service.ts │
│     HTTP implementations (fetch + validation)  │
├────────────────────────────────────────────────┤
│  3. services/{domain}/{domain}.service.ts      │
│     Factory functions (pure logic)             │
├────────────────────────────────────────────────┤
│  4. services/{domain}/index.ts                 │
│     Wiring (factory called with dependencies)  │
├────────────────────────────────────────────────┤
│  5. Call site (component/page/script)          │
│     Imports already-wired function from barrel │
└────────────────────────────────────────────────┘
```

---

## Barrel Export Convention

### next-safe-action actions — exported from `actions/` directory:

```typescript
// actions/index.ts
export { createProductAction, getProductsAction } from "./products";
export { loginAction, logoutAction } from "./auth";

// Consumed as:
import { createProductAction } from "@/actions";
```

### External API services — wired in domain `index.ts`:

```typescript
// services/products/index.ts
import { env } from "@/constants";
import { createProductFactory } from "./products.service";
import { httpCreateProduct } from "./http-products.service";

export const createProduct = createProductFactory(
  `${env.NEXT_PUBLIC_API_URL}/products`,
  httpCreateProduct,
);

export type { CreateProduct } from "./products.service";
```

### Top-level `services/index.ts`:

```typescript
// services/index.ts
export * from "./products";
export * from "./orders";
```

### ✅ DO — Always import through the barrel:
```typescript
import { createProductAction } from "@/actions";
// or
import { createProduct } from "@/services/products";
import type { CreateProduct } from "@/services/products";
```

### ❌ DON'T — Import from individual files directly:
```typescript
// NEVER do this — bypassing the barrel
import { createProductAction } from "@/actions/products";
import { createProductFactory } from "@/services/products/products.service";
```

---

## Composition Pattern Comparison

| Aspect | next-safe-action (Your server) | Traditional factories (External APIs) |
|--------|-------------------------------|--------------------------------------|
| File | `actions/{domain}.ts` | `services/{domain}/index.ts` |
| Composition | `action(schema, handler)` directly | Factory called with deps inline |
| Exported value | The action function | The wired factory handler |
| Export style | Named export | Named export |
| Import at call site | `import { action } from "@/actions"` | `import { fn } from "@/services/domain"` |

---

## Rules

### ✅ DO
- Use next-safe-action for your own server mutations — no wiring needed
- Wire external API factories in the domain's `index.ts`
- Export actions from `actions/index.ts` barrel
- Both patterns export types alongside the implementation
- Import from barrels, not individual files

### ❌ DON'T
- Don't compose factories in components, pages, or scripts
- Don't import directly from individual files — always use the barrel
- Don't use classes for services
- Don't hardcode URLs
- Don't create API routes for your own mutations if server actions suffice

---
name: service-architecture
description: Structure every domain as three independent tiers — server action, business logic factory, and HTTP implementation for external APIs — to enable testability and clean separation of concerns
---

# Service Architecture

Every domain follows a **service architecture** with three tiers. The exact tiers depend on the app context (Next.js server action vs external API client).

This is built on the **[functional-dependency-injection](../functional-dependency-injection/SKILL.md)** pattern — each tier has a specific responsibility and they compose without circular dependencies.

Types for all tiers are defined centrally in `models/`. See the **[type-contract-architecture](../type-contract-architecture/SKILL.md)** and **[factory-method-pattern](../factory-method-pattern/SKILL.md)** skills.

---

## Architecture A: Next.js App (Server Action-backed)

In a Next.js app, server actions replace both the HTTP implementation layer and the API route layer. The architecture is:

```
Tier 1: Server Action       →  actions/{domain}.ts  (next-safe-action)
Tier 2: Database Access     →  services/server/db-{domain}.service.ts
Tier 3: Composition         →  actions/index.ts
```

### Folder Structure

```
src/
├── actions/
│   ├── products.ts                    ← Tier 1: next-safe-action server actions
│   └── index.ts                       ← Tier 3: Re-exports / composition
├── services/
│   ├── server/
│   │   ├── db-products.service.ts     ← Tier 2: Database calls
│   │   └── db-orders.service.ts
│   ├── products/
│   │   ├── products.service.ts        ← Business logic factories (optional)
│   │   └── index.ts
│   └── orders/
├── models/
│   ├── products.ts                    ← Types + Zod schemas
│   └── index.ts
└── app/
    ├── products/
    │   └── page.tsx                   ← Server component, calls actions directly
    └── ...
```

### Tier 1: Server Action Layer

**File:** `actions/{domain}.ts`

Each file contains next-safe-action server actions for the domain:

```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";
import { z } from "zod";
import { db } from "@/db";
import { productsTable } from "@/db/schema";
import { productSchema } from "@/models/products";

const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
});

export const createProductAction = action(
  createProductSchema,
  async (input) => {
    const [product] = await db.insert(productsTable).values(input).returning();
    return product;
  },
);

export const getProductsAction = action(
  z.void(),
  async () => {
    return await db.select().from(productsTable);
  },
);
```

**Rules:**
- One file per domain, named `actions/{domain}.ts`
- Each action uses `action(schema, handler)` from next-safe-action
- Actions are exported and consumed directly by components
- Actions handle their own DB access or delegate to service functions

### Tier 2: Database Access Layer

**File:** `services/server/db-{domain}.service.ts`

Exports one async function per DB operation:

```typescript
// services/server/db-products.service.ts
import type { Product } from "@shared";
import type { ProductCreateInput } from "@/models";

export const dbInsertProduct = async (
  db: DB,
  input: ProductCreateInput,
): Promise<Product> => {
  const [product] = await db.insert(productsTable).values(input).returning();
  return product;
};
```

**Rules:**
- One file per domain, named `db-{domain}.service.ts`
- One function per DB operation
- Functions are plain async functions
- Return type is explicitly typed

### Tier 3: Business Logic Factory Layer (Optional)

For complex business logic between the action and the DB:

```typescript
// services/products/products.service.ts
import type { CreateProduct, ProductCreateInput } from "@/models";

export const createProductFactory = (createProduct: CreateProduct) => {
  return async (
    input: ProductCreateInput,
  ): Promise<Awaited<ReturnType<CreateProduct>>> => {
    // Business logic here (transformations, validation, etc.)
    return createProduct(input);
  };
};

export type CreateProduct = ReturnType<typeof createProductFactory>;
```

### Wiring in Actions

```typescript
// actions/products.ts
"use server";

import { db } from "@/db";
import { dbInsertProduct } from "@/services/server/db-products.service";
import { createProductFactory } from "@/services/products/products.service";

const createProduct = createProductFactory(
  (input) => dbInsertProduct(db, input),
);

export const createProductAction = action(
  createProductSchema,
  async (input) => {
    return await createProduct(input);
  },
);
```

---

## Architecture B: External API Client (Third-party Services)

For calling external third-party APIs:

```
Tier 1: HTTP Implementation  →  services/{domain}/http-{domain}.service.ts
Tier 2: Business Logic       →  services/{domain}/{domain}.service.ts
```

### Folder Structure

```
src/services/
├── products/
│   ├── products.service.ts               ← Tier 2: Factory functions
│   ├── http-products.service.ts          ← Tier 1: HTTP implementations
│   ├── products.service.test.ts
│   └── index.ts                          ← Wiring
└── ...
```

### Data Flow

### Next.js App (Server Actions)
```
Server Component (page.tsx)
    │
    ▼
action(input)
    │
    ▼ (next-safe-action validates with Zod)
Server Action
    │
    ▼ (calls service / DB directly)
Database
    │
    ▼
Returns typed data to component
```

### External API Client
```
Client Component
    │
    ▼  imports already-wired function from barrel
import { createProduct } from "@/services/products"
    │
    ▼
createProduct(data)
    │
    ▼ (factory calls httpFn)
Tier 2: Factory (calls httpFn, extracts .data)
    │
    ▼
Tier 1: HTTP Implementation (fetch + Zod validation)
    │
    ▼
External API Server
```

---

## Barrel Export Convention

### Server Actions — Export directly from action files:

```typescript
// actions/products.ts
export const createProductAction = action(schema, handler);

// Consumed as:
import { createProductAction } from "@/actions/products";
```

### External API Services — Wire in domain `index.ts`:

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

### ✅ DO — Import both the type and implementation through the barrel:
```typescript
import { createProduct } from "@/services/products";
import type { CreateProduct } from "@/services/products";
```

### ❌ DON'T — Bypass the barrel or wire at the call site:
```typescript
// NEVER do this
import { httpCreateProduct } from "@/services/products/http-products.service";
import { createProductFactory } from "@/services/products/products.service";
const createProduct = createProductFactory(url, httpCreateProduct);
```

---

## Rules Summary

### ✅ DO
- Use next-safe-action for all server mutations in Next.js
- Keep actions thin — delegate complex logic to service factories
- Use three layers per domain: action, business logic, database
- All types come from `models/`, never defined in service files
- Wire and export from `index.ts` or `actions/index.ts`

### ❌ DON'T
- Don't create API routes for your own mutations — use server actions
- Don't call server actions from other server actions via HTTP
- Don't mix implementation logic with business logic
- Don't hardcode URLs or DB connection strings

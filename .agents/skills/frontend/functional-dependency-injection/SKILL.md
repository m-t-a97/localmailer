---
name: functional-dependency-injection
description: Apply functional dependency injection where dependencies are passed as function parameters instead of constructor injection — enables trivial testability and loose coupling
---

# Functional Dependency Injection

This pattern uses **pure functional dependency injection** instead of class-based constructor injection. Every dependency (database implementation, HTTP function, platform SDK) is passed as a parameter to a factory function.

No classes, no `this`, no decorators, no DI containers. Just functions calling functions.

## The Core Idea

```typescript
// ❌ DON'T — Class-based DI
class ProductService {
  constructor(private createProduct: CreateProduct) {}
  async create(input: ProductCreateInput) { return this.createProduct(input); }
}

// ✅ DO — Functional DI
export const createProductFactory = (createProduct: CreateProduct) => {
  return async (input: ProductCreateInput) => createProduct(input);
};
```

The key difference: the factory IS the injection point. Dependencies come in, a closure goes out.

## Three DI Patterns for Next.js

### Pattern A: next-safe-action DI (Server-side, recommended)

In Next.js, server actions can use dependency injection via factory:

```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";

export const createProductActionFactory = (db: DB, schema: z.ZodSchema) => {
  return action(schema, async (input) => {
    const [product] = await db.insert(productsTable).values(input).returning();
    return product;
  });
};

// Composed in the application root:
// actions/index.ts
import { db } from "@/db";
import { createProductSchema } from "@/models/products";
import { createProductActionFactory } from "./products";

export const createProductAction = createProductActionFactory(db, createProductSchema);
```

### Pattern B: Function-only DI (Server-side, traditional)

For non-action server operations:

```typescript
// ✅ DO — Server-side: inject the DB operation function
export const getProductByIdFactory = (getProductById: GetProductById) => {
  return async (productId: string) => {
    return getProductById(productId);
  };
};
```

This is injected in the composition layer:

```typescript
// services/products/products.composition.ts
export const productService = {
  getProductById: getProductByIdFactory((id) => dbGetProductById(db, id)),
};
```

### Pattern C: URL + HTTP Function DI (Client-side, external APIs)

For third-party API calls (not your own Next.js server):

```typescript
// ✅ DO — Client-side: inject URL + HTTP function
export const getProductFactory = (
  url: string,
  httpGet: HttpGetProduct,
) => {
  return async (id: string) => {
    return httpGet(url, { id });
  };
};
```

This is injected at the call site or in the domain barrel:

```typescript
// services/products/index.ts
import API_ENDPOINTS from "@/constants/api-endpoints";
import { httpGetProduct } from "./http-products.service";
import { getProductFactory } from "./products.service";

export const getProduct = getProductFactory(
  API_ENDPOINTS.products.details,
  httpGetProduct,
);
```

## Dependency Categories

### Category 1: next-safe-action (Recommended for Next.js mutations)

Server actions encapsulate both the schema and handler. Dependencies (db, services) are injected into the factory:

```typescript
// ✅ DO — Server action factory with injected dependencies
export const updateProductActionFactory = (db: DB) => {
  return action(updateSchema, async ({ id, ...data }) => {
    const [product] = await db.update(productsTable).set(data).where(eq(productsTable.id, id)).returning();
    return product;
  });
};
```

### Category 2: Database/Service Operation Functions (Server-side)

```typescript
// ✅ DO — Server-side: inject DB operation
export const createProductFactory = (createProduct: CreateProduct) => {
  return async (input: ProductCreateInput): Promise<Product> => createProduct(input);
};
```

### Category 3: HTTP Functions (External APIs)

```typescript
// ✅ DO — Inject HTTP function for external APIs
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

### Category 4: Platform/Third-Party SDK Functions

```typescript
// ✅ DO — Inject platform function
export const signInWithProviderFactory = (signIn: SignInFn) => {
  return async (): Promise<Session> => {
    return await signIn();
  };
};
```

## Where Injection Happens

### next-safe-action: In the composition root (e.g., `actions/index.ts`)

```typescript
// actions/index.ts — THE injection site for server actions
import { db } from "@/db";
import { createProductActionFactory } from "./products";

export const createProductAction = createProductActionFactory(db);
```

### Traditional server-side: In the composition layer (`{domain}.composition.ts`)

```typescript
// services/products/products.composition.ts
import { dbInsertProduct } from "../server/db-products.service";
import { createProductFactory } from "./products.service";

export const productService = {
  createProduct: createProductFactory(
    (input) => dbInsertProduct(db, input),
  ),
};
```

### Client-side (external APIs): In the domain `index.ts`

```typescript
// services/products/index.ts
import API_ENDPOINTS from "@/constants/api-endpoints";
import { httpCreateProduct } from "@/services/products/http-products.service";
import { createProductFactory } from "@/services/products/products.service";

export const createProduct = createProductFactory(
  API_ENDPOINTS.products.create,
  httpCreateProduct,
);
```

### ❌ DON'T — Inject in component files:
```typescript
function ProductPage() {
  // NEVER do this — injection happens in the composition layer, not components
  const handler = createProductFactory((input) => dbInsertProduct(db, input));
}
```

## Why This Pattern?

| Concern | Class DI | Functional DI |
|---------|----------|---------------|
| Testability | Need mock class/framework | Just pass your test framework's mock function |
| Boilerplate | Constructor, `this`, types | Just function params |
| Bundle size | More bytes | Minimal |
| Tree-shaking | Harder | Natural — functions are trees |
| Cognitive load | OOP concepts needed | Just functions |

## Testing Benefit

Because dependencies are function parameters, testing is trivially simple:

```typescript
// ✅ DO — Server-side: Test by passing mock function directly
test("createProductFactory", async () => {
  const mockFn = vi.fn().mockResolvedValue(mockProduct);
  const handler = createProductFactory(mockFn);
  const result = await handler(input);
  expect(mockFn).toHaveBeenCalledWith(input);
  expect(result).toEqual(mockProduct);
});
```

```typescript
// ✅ DO — Test next-safe-action factory with mocked db
test("createProductActionFactory", async () => {
  const mockDb = { insert: vi.fn() };
  mockDb.insert.mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([mockProduct]) }) });
  const action = createProductActionFactory(mockDb, createProductSchema);
  // Execute the action and assert on the result
  const result = await action({ name: "Test", price: 10 });
  expect(result?.data).toEqual(mockProduct);
});
```

## Rules

### ✅ DO
- Use next-safe-action for server mutations (recommended in Next.js)
- Inject DB operations as function parameters
- Inject HTTP functions + URL for external API calls
- Use the composition layer or domain index.ts as the single injection site
- Keep factory functions pure (no side effects)

### ❌ DON'T
- Don't import implementations inside service factories
- Don't hardcode URLs or DB connections in factories
- Don't use classes or `new` for services
- Don't create DI containers or service locators
- Don't use global singletons as implicit dependencies

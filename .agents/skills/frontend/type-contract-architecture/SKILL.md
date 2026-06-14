---
name: type-contract-architecture
description: Define TypeScript function signature types in each project's models/ folder — these types act as contracts between service factories, server actions, and their implementations
---

# Type Contract Architecture

This pattern defines **every operation as a TypeScript function type** in each project's `models/` folder. These types act as contracts that both the factory (consumer) and implementation (provider) must conform to.

The type IS the API boundary. If the type compiles, the layers fit together.

Types are NEVER defined in service files. They are always defined in the project's `models/` folder and imported into services.

## Folder Structure

```
src/models/
├── index.ts                  ← Re-exports all models
├── products.ts               ← Types + schemas for products domain
├── orders.ts                 ← Types + schemas for orders domain
├── reviews.ts
└── product-images.ts

packages/shared/src/models/
├── index.ts                  ← Re-exports all shared models
├── products.ts               ← Canonical Zod schemas + inferred types
├── orders.ts
└── ...
```

Every domain gets its own flat file in `models/`. Types and Zod schemas can co-exist in the same file.

## Three Naming Conventions

### Convention A: next-safe-action Server Actions

For server actions with next-safe-action, types are inferred from Zod schemas — no manual type contracts needed:

```typescript
// models/products.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  price: z.number(),
  categoryId: z.string(),
});

export type Product = z.infer<typeof productSchema>;
```

The server action uses these schemas directly:

```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";
import { createProductSchema, productSchema } from "@/models/products";

// Types are inferred — no need to define CreateProduct type contract manually
export const createProductAction = action(
  createProductSchema,
  async (input) => {
    // input is typed as CreateProductInput
    return typedProduct; // validated against response
  },
);
```

### Convention B: Server-side (Plain Operation Names)

For traditional server-side factories (not next-safe-action):

```typescript
// models/products.ts
import type { Product } from "@shared";
import type { productsTable } from "@/db/schema";

export type ProductCreateInput = typeof productsTable.$inferInsert;
export type ProductUpdateInput = Partial<Omit<ProductCreateInput, "categoryId">>;

export type CreateProduct = (input: ProductCreateInput) => Promise<Product>;
export type GetProductById = (productId: string) => Promise<Product | null>;
export type ListProductsByCategory = (categoryId: string) => Promise<Product[]>;
export type UpdateProduct = (productId: string, input: ProductUpdateInput) => Promise<Product | null>;
export type DeleteProduct = (productId: string) => Promise<Product | null>;
```

### Convention C: Client-side (Http-prefixed Names for External APIs)

For external API calls:

```typescript
// models/products.ts
import { z } from "zod";
import { getValidationResult, productSchema, type CreateProductInput } from "@shared";

export const httpCreateProductResponseBodySchema = z.object({
  data: productSchema,
});
export type HttpCreateProductResponseBody = z.infer<typeof httpCreateProductResponseBodySchema>;

export const validateHttpCreateProduct = (data: CreateProductInput) =>
  getValidationResult(data, httpCreateProductResponseBodySchema);

export type HttpCreateProduct = (
  url: string,
  body: CreateProductInput,
) => Promise<HttpCreateProductResponseBody>;
```

---

## How Contracts Flow

### next-safe-action Flow
```
1. Schema defined in models/products.ts
   export const createProductSchema = z.object({ ... });
   export type CreateProductInput = z.infer<typeof createProductSchema>;
       │
       ▼
2. Action uses the schema
   export const createProductAction = action(createProductSchema, handler);
       │
       ▼
3. Input is automatically validated and typed
   — No manual type contract needed
```

### Traditional Server-side Flow
```
1. Type defined in models/products.ts
   export type CreateProduct = (input: ProductCreateInput) => Promise<Product>;
       │
       ▼
2. Factory accepts it as parameter
   export const createProductFactory = (createProduct: CreateProduct) => { ... };
       │
       ▼
3. Database implementation conforms to the type
   export const dbInsertProduct = async (db, input: ProductCreateInput): Promise<Product> => { ... };
```

---

## Naming Rules

### next-safe-action (Zod schema-driven)

| Artifact | Convention | Example |
|----------|-----------|---------|
| Input schema | `{verb}{Noun}Schema` | `createProductSchema` |
| Input type | `{Verb}{Noun}Input` | `CreateProductInput` |
| Response type | `{Noun}` (inferred) | `Product` |

### Server-side (DB operation types)

| Operation | Type Name | Example |
|-----------|-----------|---------|
| Create | `Create{Noun}` | `CreateProduct` |
| Read | `Get{Noun}ById` | `GetProductById` |
| List | `List{Nouns}By{Field}` | `ListProductsByCategory` |
| Update | `Update{Noun}` | `UpdateProduct` |
| Delete | `Delete{Noun}` | `DeleteProduct` |

### Client-side (HTTP operation types for external APIs)

| HTTP Method | Type Prefix | Example |
|-------------|-------------|---------|
| GET | `HttpGet*` | `HttpGetProductById` |
| POST | `HttpCreate*` | `HttpCreateProduct` |
| PATCH | `HttpUpdate*` | `HttpUpdateProductImage` |

---

## Export Chain

Types flow through barrel exports:

```typescript
// models/products.ts
export type { CreateProduct, GetProductById, ... };

// models/index.ts
export * from "./products";

// Accessed as:
import { CreateProduct } from "@/models";
```

---

## Rules

### ✅ DO
- Define schemas and types in flat `models/{domain}.ts` files
- Use Zod schemas for next-safe-action — types are inferred
- Use plain names for server-side types (`CreateProduct`)
- Use `Http{Verb}{Noun}` for client-side types (external APIs)
- Export through `models/index.ts`

### ❌ DON'T
- Don't define types in service files — they go in `models/`
- Don't repeat the type definition — one type, two consumers
- Don't mix unrelated domain types in the same file
- Don't write manual types for next-safe-action inputs — let `z.infer` derive them

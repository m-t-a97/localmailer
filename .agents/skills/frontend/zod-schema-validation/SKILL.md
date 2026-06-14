---
name: zod-schema-validation
description: Use Zod schemas for runtime validation — form inputs via next-safe-action, server action inputs, and external API responses
---

# Zod Schema Validation

This pattern uses Zod for runtime validation at three levels:

1. **next-safe-action schemas** — automatic input validation for server actions
2. **Form/Input validation** — user-facing forms with cross-field validation
3. **External API response validation** — runtime type checking of third-party HTTP responses

A shared validation result utility (`getValidationResult`) and canonical entity schemas (`productSchema`, `orderSchema`, etc.) live in a shared package.

## Folder Structure

```
packages/shared/src/models/
├── index.ts                     ← Re-exports all shared schemas
├── products.ts                  ← Canonical schema + inferred type
├── orders.ts                    ← Canonical schema + inferred type
└── ...

src/models/
├── products.ts                  ← App-specific schemas + types
├── orders.ts                    ← App-specific schemas + types
└── index.ts

src/actions/
├── products.ts                  ← next-safe-action with Zod schemas
└── orders.ts
```

Shared Zod schemas belong in a shared package. Consumed across all apps via workspace protocol.

## Pattern 1: next-safe-action Server Action Schemas

next-safe-action automatically validates inputs using the provided Zod schema:

```typescript
// actions/products.ts
"use server";

import { action } from "next-safe-action";
import { z } from "zod";
import { db } from "@/db";
import { productsTable } from "@/db/schema";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().uuid("Invalid category"),
  description: z.string().max(1000).optional(),
});

// The schema handles all input validation automatically
export const createProductAction = action(
  createProductSchema,
  async (input) => {
    // input is already validated and typed
    const [product] = await db.insert(productsTable).values(input).returning();
    return product;
  },
);
```

On the client, validation errors are returned as `result.validationErrors`:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";

function ProductForm() {
  const { execute, result } = useAction(createProductAction);

  // result.validationErrors — typed field-level errors
  // e.g. { name: { _errors: ["Name is required"] } }
}
```

### ✅ DO — Pass Zod schema to `action(schema, handler)`
### ✅ DO — Provide user-facing error messages in `.min()`, `.max()`, etc.
### ❌ DON'T — Manually validate inside the action handler — the schema handles it

## Pattern 2: Shared Canonical Schemas

Entity schemas are defined in the shared package and represent the single source of truth:

```typescript
// packages/shared/src/models/products.ts
import { z } from "zod";
import { getValidationResult } from "../helpers";

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.enum(["active", "inactive", "discontinued"]),
  price: z.number().positive(),
});
export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = productSchema.pick({
  name: true,
  price: true,
  description: true,
});
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
```

### ✅ DO — Infer types from schemas:
```typescript
export type Product = z.infer<typeof productSchema>;
```

### ❌ DON'T — Duplicate the type manually:
```typescript
// NEVER do this — let z.infer derive the type
export interface Product { id: string; name: string; ... }
```

## Pattern 3: Form Schemas (Per-App)

Form schemas live in the respective app's `models/{domain}.ts`:

```typescript
// src/models/orders.ts
import { z } from "zod";

const createOrderInputSchema = z.object({
  productId: z.string().uuid("productId must be a valid UUID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  shippingAddress: z.string().min(1, "Shipping address is required"),
  couponCode: z.string().optional(),
  priority: z.enum(["standard", "express"]).optional(),
});
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
```

## Pattern 4: External API Response Schemas

For third-party API responses (not your own server actions):

```typescript
// src/models/products.ts
import { z } from "zod";
import { getValidationResult, productSchema } from "@shared";

export const httpCreateProductResponseBodySchema = z.object({
  data: productSchema,
});
export type HttpCreateProductResponseBody = z.infer<typeof httpCreateProductResponseBodySchema>;

export const validateHttpCreateProduct = (data: unknown) =>
  getValidationResult(data, httpCreateProductResponseBodySchema);
```

These validators are used in the HTTP implementation layer:

```typescript
// services/products/http-products.service.ts
import { validateHttpCreateProduct, type HttpCreateProduct } from "@/models";

export const httpCreateProduct: HttpCreateProduct = async (url, body) => {
  const response = await fetch(url, { ... });
  const data = await response.json();
  const validationResult = validateHttpCreateProduct(data);
  if (!validationResult.success) {
    throw new Error(validationResult.error);
  }
  return validationResult.value;
};
```

## Pattern 5: Cross-Field Validation with superRefine

Use `superRefine` for validations involving multiple fields:

```typescript
// packages/shared/src/models/orders.ts
export const orderSchema = z.object({
  id: z.string().uuid(),
  status: orderStatusSchema.nullable().optional(),
  shippingAddress: z.string().min(1).nullable().optional(),
  couponCode: z.string().nullable().optional(),
}).superRefine((arg, ctx) => {
  if (isExpressShipping && !hasValidAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["shippingAddress"],
      message: "Express shipping requires a valid address.",
    });
  }
});
```

## Common Utilities

The shared `getValidationResult` utility wraps Zod's `safeParse`:

```typescript
// packages/shared/src/helpers/generics.ts
import { z } from "zod";

type ValidationResult<T> =
  | { success: true; value: T }
  | { success: false; error: string };

export function getValidationResult<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, value: result.data };
  }
  return { success: false, error: result.error.errors.map(e => e.message).join(", ") };
}
```

## When to Use What

| Scenario | Pattern | Validation Location |
|----------|---------|-------------------|
| Server mutation | next-safe-action `action(schema, handler)` | Automatic, at action boundary |
| Form validation | `@tanstack/react-form` with Zod validators | Client-side, with server re-validation |
| External API response | `getValidationResult(data, schema)` | In HTTP implementation layer |
| Cross-field validation | `superRefine` on the Zod schema | In the schema definition |

## Rules

### ✅ DO
- Use next-safe-action for server-side input validation — schema IS the validator
- Define shared entity schemas in the shared package's models
- Define app-specific schemas in the app's `models/{domain}.ts`
- Use `z.infer` to derive TypeScript types from schemas
- Use `superRefine` for cross-field validation
- Validate external API responses in the HTTP implementation layer

### ❌ DON'T
- Don't put schemas in component files — they go in `models/`
- Don't manually type what `z.infer` can derive
- Don't manually validate in next-safe-action handlers — the schema handles it
- Don't duplicate schemas across apps — share them via a shared package
- Don't catch validation errors silently — let them propagate through next-safe-action

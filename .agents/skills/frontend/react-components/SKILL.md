---
name: react-components
description: Use when writing, refactoring, or reviewing React components inside a Next.js App Router application. Focuses on SOLID component design, composition, and correct use of server components, server actions, and React Query for client-side state.
---

# React Components

## When to use this skill

Use this skill ONLY when:

- Writing React components inside a Next.js app
- Refactoring React UI code
- Reviewing React components
- Building UI features using Next.js App Router

Do NOT use for:

- Backend architecture design
- API design
- Build tooling or infra
- Non-UI server logic

---

# Core Rules

1. Components must follow SOLID principles
1. Components must stay small and focused
1. Use `"use client"` when writing client components
1. Data fetching must follow Next.js patterns
1. Never use `useEffect` for data fetching
1. Business logic must be extracted into hooks
1. Composition is preferred over configuration
1. Components must be easy to read and test
1. Always use Shadcn UI primitives for UI consistency and accessibility
1. Server actions with next-safe-action are the default for mutations
1. Server components handle initial data fetching

---

# Data Fetching Architecture

## 1. Server Components (Initial data)

Use server components for:

- Initial page data
- SEO-critical content
- Data required before render
- Avoiding loading states on first paint

### Example — calling a server action directly:

```tsx
// app/products/page.tsx
import { getProductsAction } from "@/actions/products";

export default async function ProductsPage() {
  const result = await getProductsAction();
  const products = result?.data ?? [];

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Example — using a direct DB query in a server component:

```tsx
// app/products/page.tsx
import { db } from "@/db";
import { productsTable } from "@/db/schema";

export default async function ProductsPage() {
  const products = await db.select().from(productsTable);

  return (
    <div>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

## 2. React Query (Client-side state)

Use React Query for:

- Interactive data fetching (search, pagination, polling)
- Background refetching
- Cache synchronization
- Mutations with shared UI impact

### Example

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductsAction } from "@/actions/products";
import { QueryKeys } from "@/constants/query-keys";

function useProducts() {
  return useQuery({
    queryKey: [QueryKeys.PRODUCTS],
    queryFn: async () => {
      const result = await getProductsAction();
      return result?.data ?? [];
    },
  });
}
```

---

## 3. Mutations with next-safe-action

### A. Simple mutations (useAction directly)

Use when:

- Action is isolated
- No shared UI state is affected
- No optimistic updates are needed

```tsx
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";
import { toast } from "sonner";

function CreateProductForm() {
  const { execute, status } = useAction(createProductAction, {
    onSuccess: () => toast.success("Product created"),
    onError: (error) => toast.error(error),
  });

  return (
    <form action={execute}>
      {/* fields */}
    </form>
  );
}
```

---

### B. React Query mutations (complex actions)

Use when:

- Multiple components depend on updated data
- Cache must be updated or invalidated
- Optimistic UI is needed
- Shared loading/error state is required

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProductAction } from "@/actions/products";
import { QueryKeys } from "@/constants/query-keys";

function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input) => {
      const result = await updateProductAction(input);
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTS] });
    },
  });
}
```

---

### Critical Rule

If a mutation affects visible shared UI state:

→ It MUST use React Query with cache invalidation

---

# Component Design Rules

## Single Responsibility

A component should do ONE thing:

- Render UI
- Or orchestrate components
- Or bind data to UI (thin layer)

---

## Open / Closed Principle

Prefer composition over props-based variants.

### Good

```tsx
<Card>
  <ProductInfo />
</Card>
```

### Bad

```tsx
<Card variant="product" />
```

---

## Interface Segregation

Avoid large prop interfaces.

### Bad

```tsx
<ProductCard showActions canEdit canDelete />
```

### Better

```tsx
<ProductCard />
<EditableProductCard />
```

---

## Dependency Inversion

UI components must NOT depend on API details directly.

All server interaction must go through:

- Server actions (next-safe-action)
- Hooks (React Query)
- Server components (initial data)

---

# React Query Rules

## Server state must NEVER be duplicated in useState

## Never use useEffect for fetching

```tsx
// ❌ forbidden
useEffect(() => {
  fetch("/api/products");
}, []);
```

---

# Component Types

## 1. Presentational Components

- Pure UI
- No data fetching
- No side effects

```tsx
function ProductCard({ product }: { product: Product }) {
  return <div>{product.name}</div>;
}
```

---

## 2. Container Components

- Connect hooks to UI
- Minimal logic

```tsx
function ProductList() {
  const { data } = useProducts();

  return data.map((product) => (
    <ProductCard key={product.id} product={product} />
  ));
}
```

---

# Hooks Rules

Hooks own:

- Data fetching (React Query)
- Mutations
- Business logic
- Side effects

Components own:

- Rendering
- Composition

---

# State Rules

## Local UI state

Use `useState`

## Server state

Managed by:

- Server components (initial data)
- React Query (client state)
- Server actions (mutations)

Never duplicate server state locally.

---

# Folder Structure

```text
Product/
├── ProductList.tsx
├── ProductCard.tsx
├── useProducts.ts
├── useUpdateProduct.ts
```

---

# Anti-Patterns

Reject code that:

- Uses useEffect for fetching
- Fetches inside components directly
- Wraps everything in React Query unnecessarily
- Has components over ~200 lines
- Uses large boolean prop interfaces
- Mixes UI + business logic
- Duplicates server state in useState
- Overuses optimistic patterns without need
- Calls server actions from server components using `useAction`

---

# Code Review Checklist

- Are server components used for initial page data?
- Are server actions used for mutations?
- Is React Query used only for client-side state?
- Is `useEffect` avoided for data fetching?
- Is each component single-responsibility?
- Is logic extracted into hooks?
- Are props minimal and explicit?
- Is server state not duplicated locally?
- Is composition preferred over configuration?

---

# Success Criteria

A React component is high quality if:

1. It does one thing well
2. It uses server components for initial data
3. It uses next-safe-action for mutations
4. It uses React Query for client state
5. It separates UI from logic cleanly
6. It is small and composable
7. It avoids unnecessary props
8. It is easy to extend via composition
9. It is easy to understand quickly

---
name: react-query-cache-utilities
description: Use TanStack React Query with a centralized QueryKeys enum and a cache utility for server state caching — combine with next-safe-action for typed mutations
---

# React Query Cache Utilities

> This skill covers `@tanstack/react-query` with `next-safe-action`.

This pattern uses React Query (`@tanstack/react-query`) for server state caching, combined with next-safe-action for typed server mutations.

- **`useQuery`** — for component-level data fetching
- **`useMutation`** — wraps next-safe-action server actions for cache invalidation
- **`fetchCachedDataOrFetchNewQuery`** — for app boot hydration into Zustand stores
- **`QueryKeys`** — centralized enum for all cache keys

## Folder Structure

```
constants/
├── query-keys.ts        ← QueryKeys enum ONLY
├── query-client.ts      ← QueryClient instance + cache utility
├── api-endpoints.ts
└── env.ts
```

## QueryClient Setup (`constants/query-client.ts`)

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();
```

## QueryKeys Enum (`constants/query-keys.ts`)

All cache keys are centralized in a single enum:

```typescript
// constants/query-keys.ts
export enum QueryKeys {
  GET_USER_ME = "get_user_me",
  PRODUCT = "product",
  PRODUCTS = "products",
  ORDER = "order",
  ORDERS = "orders",
}
```

### ✅ DO — All query keys in the enum, no inline string literals
### ❌ DON'T — Use string literals as query keys

```typescript
// ❌ DON'T
useQuery({ queryKey: ["get_user_me"], queryFn: getUserMe });

// ✅ DO
useQuery({ queryKey: [QueryKeys.GET_USER_ME], queryFn: getUserMe });
```

## Data Fetching with Server Actions

In Next.js, server actions can be used as query functions:

```typescript
// hooks/useProducts.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKeys } from "@/constants/query-keys";

async function getProducts() {
  const res = await fetch("/api/products");
  return res.json();
}

export function useProducts() {
  return useQuery({
    queryKey: [QueryKeys.PRODUCTS],
    queryFn: getProducts,
  });
}
```

For server-side data fetching (initial page load), call the action directly in the server component:

```typescript
// app/products/page.tsx
import { getProductsAction } from "@/actions/products";

export default async function ProductsPage() {
  const products = await getProductsAction();
  // products.data — typed response
  return <ProductsList products={products.data ?? []} />;
}
```

## Mutations with next-safe-action

Wrap next-safe-action server actions in `useMutation` for cache invalidation:

```typescript
// hooks/useCreateProduct.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProductAction } from "@/actions/products";
import { QueryKeys } from "@/constants/query-keys";

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; price: number }) => {
      const result = await createProductAction(input);
      if (result?.serverError) throw new Error(result.serverError);
      return result?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTS] });
    },
  });
}
```

Or use the simpler `useAction` directly without `useMutation`:

```typescript
// components/CreateProductForm.tsx
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";
import { queryClient } from "@/constants/query-client";
import { QueryKeys } from "@/constants/query-keys";

export function CreateProductForm() {
  const { execute, status } = useAction(createProductAction, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PRODUCTS] });
    },
  });

  return (
    <form action={execute}>
      {/* fields */}
    </form>
  );
}
```

## Cache Utility (`constants/query-client.ts`)

This utility is used specifically for **app boot hydration** — loading cached or fresh data into Zustand stores before the first render:

```typescript
// constants/query-client.ts
export const fetchCachedDataOrFetchNewQuery = async <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<unknown>
): Promise<T | null> => {
  const cachedData = queryClient.getQueryData(queryKey);

  if (cachedData) {
    return cachedData as T;
  }

  const fetchedQueryData = await queryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  return fetchedQueryData;
};
```

### ✅ DO — Graceful degradation: returns `null` on error, never throws
### ✅ DO — Cache-first approach: check cache before network
### ✅ DO — `staleTime` of 60 seconds

## Usage: Boot Hydration into Zustand Stores

```typescript
// lib/bootstrap.ts
import { queryClient, fetchCachedDataOrFetchNewQuery } from "@/constants/query-client";
import { QueryKeys } from "@/constants/query-keys";
import { useSessionStore } from "@/stores/session-store";

async function bootstrapApp() {
  const userData = await fetchCachedDataOrFetchNewQuery(
    [QueryKeys.GET_USER_ME],
    getCurrentUser,
  );

  if (userData) {
    useSessionStore.getState().setUser(userData);
  } else {
    useSessionStore.getState().setUser(null);
  }
}
```

### ✅ DO — Use `.getState()` to write to Zustand stores outside React

## When to Use What

| Scenario | Tool | Why |
|----------|------|-----|
| React component needs data | `useQuery` | Built-in caching, refetching, loading states |
| Server component initial data | Server action directly | No RTT, no loading state |
| Mutation with cache update | `useAction` + `queryClient.invalidateQueries` | Typed, validated, cache-aware |
| App boot, hydrate store | `fetchCachedDataOrFetchNewQuery` | Cache-first, populates Zustand before render |
| Complex optimistic updates | `useMutation` with `onMutate` | Standard React Query pattern |

## Rules

### ✅ DO
- Put `QueryKeys` enum in `constants/query-keys.ts`
- Put `QueryClient` + utility in `constants/query-client.ts`
- Use next-safe-action for mutations and invalidate queries on success
- Use `useQuery` for client-side data fetching
- Use server actions directly in server components for initial data

### ❌ DON'T
- Don't use `fetch` to call your own Next.js API — use server actions
- Don't inline query key strings — always use `QueryKeys`
- Don't forget `staleTime` when using `fetchCachedDataOrFetchNewQuery`
- Don't skip cache check — always call `getQueryData` first

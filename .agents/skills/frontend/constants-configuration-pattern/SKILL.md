---
name: constants-configuration-pattern
description: Centralize all configuration constants — API endpoints, environment variables, query keys — in the constants/ directory with strict naming and export conventions
---

# Constants & Configuration Pattern

All configuration and constant values are centralized in `constants/`, organized by concern. No hardcoded strings in service or component files.

## Folder Structure

```
constants/
├── api-endpoints.ts      ← All API URL endpoints (as const)
├── env.ts                ← Environment variables
├── query-keys.ts         ← Cache keys (if using TanStack React Query)
└── index.ts              ← Optional re-exports
```

## Environment Config (`constants/env.ts`)

Use `@t3-oss/env-nextjs` with Zod schemas for validated, typed environment variables:

```typescript
// constants/env.ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().nonempty(),
    API_SECRET: z.string().nonempty(),
  },

  clientPrefix: "NEXT_PUBLIC_",
  client: {
    NEXT_PUBLIC_API_URL: z.string().nonempty().url(),
    NEXT_PUBLIC_BASE_URL: z.string().nonempty().url(),
    NEXT_PUBLIC_APP_NAME: z.string().nonempty(),
    NEXT_PUBLIC_APP_VERSION: z.string().nonempty(),
  },

  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```

### ✅ DO — Use `createEnv` with Zod for validated env vars
### ✅ DO — Separate `server` and `client` blocks
### ✅ DO — Set `emptyStringAsUndefined: true`
### ✅ DO — Match `clientPrefix: "NEXT_PUBLIC_"`
### ❌ DON'T — Access raw env vars directly in service/hook files

```typescript
// ❌ DON'T — Raw access
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// ✅ DO — Always import from ./env
import { env } from "[project-root]/constants/env";
const apiUrl = env.NEXT_PUBLIC_API_URL;
```

## API Endpoints (`constants/api-endpoints.ts`)

Used for external API URLs (third-party services, not the Next.js app's own API):

```typescript
// constants/api-endpoints.ts
import { env } from "./env";

const API_ENDPOINTS = {
  metadata: {
    app: `${env.NEXT_PUBLIC_API_URL}/app_metadata`,
  },
  auth: {
    createAccount: `${env.NEXT_PUBLIC_API_URL}/auth/create_account`,
  },
  users: {
    getMe: `${env.NEXT_PUBLIC_API_URL}/users/me`,
    getDetails: `${env.NEXT_PUBLIC_API_URL}/users/details`,
    update: `${env.NEXT_PUBLIC_API_URL}/users`,
    delete: `${env.NEXT_PUBLIC_API_URL}/users`,
  },
  products: {
    root: `${env.NEXT_PUBLIC_API_URL}/products`,
    search: `${env.NEXT_PUBLIC_API_URL}/products/search`,
    count: `${env.NEXT_PUBLIC_API_URL}/products/count`,
  },
  subscriptions: {
    plans: `${env.NEXT_PUBLIC_API_URL}/subscriptions/plans`,
    records: `${env.NEXT_PUBLIC_API_URL}/subscriptions/records`,
  },
} as const;

export default API_ENDPOINTS;
```

### ✅ DO — `as const` for type-safe URL access
### ✅ DO — Template literals with env base URL
### ❌ DON'T — Hardcode `https://` URLs — always use `` `${env.NEXT_PUBLIC_API_URL}/path` ``

## next-safe-action Usage

In a Next.js app with `next-safe-action`, you don't need API endpoint constants for your own server actions. Server actions are called directly by name, not via HTTP URLs:

```typescript
// actions/products.ts  (NOT in constants)
"use server";

import { action } from "next-safe-action";
import { z } from "zod";

export const createProductAction = action(
  z.object({ name: z.string(), price: z.number() }),
  async (input) => {
    // Direct DB access — no HTTP call needed
    const product = await db.insert(productsTable).values(input).returning();
    return product;
  },
);
```

Consumed directly in components:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";

function CreateProductForm() {
  const { execute, result, status } = useAction(createProductAction);
  // ...
}
```

API endpoint constants are only needed for:
- External third-party APIs (not your own server)
- Server-to-server communication
- Webhook callbacks

## Query Keys (`constants/query-keys.ts`)

If using TanStack React Query, query keys go in `constants/query-keys.ts`:

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

QueryClient setup belongs in `lib/query-client.ts` — see the [React Query Cache Utilities](./react-query-cache-utilities/SKILL.md) skill.

## Framework-Specific Notes

- **Next.js**: Server variables available only in server components and API routes. Client variables (`NEXT_PUBLIC_*`) work in both server and client components.
- **next-safe-action**: Server actions replace the need for API route constants for your own app's mutations/queries.

## Rules

### ✅ DO

- `API_ENDPOINTS` uses `as const` for type safety
- Use `createEnv` from `@t3-oss/env-nextjs` with Zod for env validation
- Separate `server` and `client` env vars
- Set `emptyStringAsUndefined: true`
- Match `clientPrefix: "NEXT_PUBLIC_"`
- Access env through `env` export, never directly from env globals
- Template literals for URL construction: `` `${env.NEXT_PUBLIC_API_URL}/path` ``
- Use server actions instead of internal API routes for your own app's operations

### ❌ DON'T

- Don't hardcode URLs anywhere outside `api-endpoints.ts`
- Don't access raw env vars in service, hook, or component files
- Don't mix config concerns in the same file
- Don't skip Zod validation on environment variables
- Don't create API endpoint constants for your own server actions — call them directly

---
name: zustand-state-management
description: Manage global application state using Zustand — each domain gets its own store file with typed state and actions, consumed via selector-based hooks
---

# Zustand State Management

> This skill covers Zustand.

This pattern uses **Zustand** for global state management. Stores are defined with `create()` from `zustand`, organized by domain, and consumed via auto-generated hooks with selector-based subscriptions.

No providers, no context wrappers, no boilerplate. Just stores.

## Folder Structure

```
stores/
├── session-store.ts        # Session + user state
├── cart-store.ts           # Shopping cart state
├── product-store.ts        # Product catalog state
└── index.ts                # Re-exports all stores
```

Each domain gets its own store file in `stores/`. Stores are **not** nested — each store is independent.

## Store Definition Pattern

```typescript
// stores/session-store.ts
import { create } from "zustand";

interface SessionState {
  session: Session | undefined | null;
  user: User | undefined | null;
  isFetchingUser: boolean | null;

  setSession: (session: Session | undefined | null) => void;
  setUser: (user: User | undefined | null) => void;
  setIsFetchingUser: (fetching: boolean | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: undefined,
  user: undefined,
  isFetchingUser: null,

  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setIsFetchingUser: (isFetchingUser) => set({ isFetchingUser }),
  clear: () => set({
    session: undefined,
    user: undefined,
    isFetchingUser: null
  }),
}));
```

### ✅ DO — Name the hook `use{Domain}Store`:
```typescript
export const useSessionStore = create<SessionState>(/* ... */);
```

### ❌ DON'T — Default export stores:
```typescript
// ❌ DON'T
export default create<SessionState>()(/* ... */);
```

## Initial State Convention

| Value | Meaning |
|-------|---------|
| `undefined` | Uninitialized / still loading |
| `null` | Absent / empty / not available |
| `default value` | Known initial state |

```typescript
session: undefined,           // Haven't checked auth yet
user: null,                   // Checked auth, no user found
selectedCategory: "electronics", // Known default
```

## Reading State — Selector Pattern

Always use selectors to prevent unnecessary re-renders:

```typescript
// ✅ DO — Selector (only re-renders when selected value changes)
function UserProfile() {
  const user = useSessionStore((state) => state.user);
  return <div>{user?.fullName}</div>;
}

// ✅ DO — Multiple selectors
function ProfileActions() {
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
}
```

### ❌ DON'T — Destructure the entire store:
```typescript
// ❌ DON'T — Causes re-render on ANY state change
function BadComponent() {
  const { user, setUser, isFetchingUser } = useSessionStore();
}
```

## Writing State — Action Pattern

Actions are defined in the store and update state via `set()`:

```typescript
export const useSessionStore = create<SessionState>((set) => ({
  session: undefined,
  setSession: (session) => set({ session }),
}));

// Used as:
const setSession = useSessionStore((state) => state.setSession);
setSession({ id: "abc", email: "test@test.com" });
```

### ✅ DO — `set()` does shallow merge — only pass changed properties:
```typescript
set({ session: newSession });       // Other state properties are preserved
set({ user: null });                // Only updates user
```

## Async Actions in Stores

For async flows that update multiple state fields, define the action in the store:

```typescript
// stores/cart-store.ts
import { create } from "zustand";

interface CartState {
  cartItems: CartItem[];
  loading: boolean;
  setCartItems: (items: CartItem[]) => void;
  hydrate: (userId: string) => Promise<void>;
}

export const useCartStore = create<CartState>((set) => ({
  cartItems: [],
  loading: false,

  setCartItems: (cartItems) => set({ cartItems }),

  hydrate: async (userId: string) => {
    set({ loading: true });
    try {
      // Can call a server action directly
      const { items } = await getCartByUserIdAction({ userId });
      set({ cartItems: items ?? [], loading: false });
    } catch {
      set({ cartItems: [], loading: false });
    }
  },
}));
```

### ✅ DO — Async actions can call server actions (next-safe-action) directly
### ❌ DON'T — Put async logic in components — extract to store actions or custom hooks

## Store Composition Through Hooks

Complex multi-store operations go in custom hooks, not stores:

```typescript
// hooks/useCartWithSession.ts
import { useSessionStore } from "@/stores/session-store";
import { useCartStore } from "@/stores/cart-store";

const useCartWithSession = () => {
  const session = useSessionStore((state) => state.session);
  const setCartItems = useCartStore((state) => state.setCartItems);

  const syncCartWithSession = async () => {
    if (session) {
      const result = await getCartByUserIdAction({ userId: session.id });
      setCartItems(result?.data?.items ?? []);
    } else {
      setCartItems([]);
    }
  };

  return { syncCartWithSession };
};

export default useCartWithSession;
```

### ✅ DO — Compose stores + server actions in custom hooks
### ❌ DON'T — Call server action factories inside store definitions

## Accessing Store Outside React

Use `.getState()` and `.setState()` for imperative access:

```typescript
// ✅ DO — Read outside React
const state = useSessionStore.getState();
console.log(state.user);

// ✅ DO — Write outside React
useSessionStore.setState({ user: null });

// Example: hydrate on app boot
async function bootstrapApp() {
  const result = await getCurrentUserAction();
  useSessionStore.getState().setUser(result?.data ?? null);
}
```

## Hydration in Next.js Server Components

In Next.js, you can hydrate Zustand stores from server components by passing data as props:

```typescript
// stores/session-store.ts
export const useSessionStore = create<SessionState>((set) => ({
  session: undefined,
  user: undefined,
  isFetchingUser: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setIsFetchingUser: (isFetchingUser) => set({ isFetchingUser }),
  clear: () => set({ session: undefined, user: undefined, isFetchingUser: false }),
}));
```

```typescript
// app/layout.tsx (server component) — pass data to client component
import { getSessionAction } from "@/actions/auth";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const result = await getSessionAction();
  return (
    <html>
      <body>
        <SessionHydrator session={result?.data ?? null}>
          {children}
        </SessionHydrator>
      </body>
    </html>
  );
}
```

```typescript
// components/SessionHydrator.tsx (client component)
"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/session-store";

export function SessionHydrator({
  session,
  children,
}: {
  session: Session | null;
  children: React.ReactNode;
}) {
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    setSession(session);
  }, [session, setSession]);

  return <>{children}</>;
}
```

## Rules

### ✅ DO
- Create one store per domain in `stores/{domain}-store.ts`
- Use `undefined` for uninitialized, `null` for absent
- Use selectors (`state => state.field`) when reading in components
- Define actions inside the store via `set()`
- Compose multiple stores through custom hooks
- Use `.getState()` for imperative access outside React
- Hydrate stores from server components via client components

### ❌ DON'T
- Don't use providers or context wrappers — Zustand doesn't need them
- Don't destructure the entire store in components
- Don't put service factory logic inside store definitions
- Don't default-export stores (named exports only)
- Don't nest stores or create store hierarchies

---
name: error-handling
description: Handle errors across the three tiers — HTTP/database layer rejection, server action validation failure, and component-level try/catch with toast notifications
---

# Error Handling

This pattern follows a **three-tier error handling pattern** in Next.js:

1. **Implementation layer** — rejects on errors (DB failure, server action error)
2. **Server action layer** — returns typed errors via next-safe-action (never throws across the network)
3. **Component layer** — catches errors and displays via toast (sonner/shadcn)

No custom error classes. No centralized error reporting. Errors are typed and predictable.

---

## Tier 1: Database / Implementation Layer

Database operations throw on failure. They are called inside server actions:

```typescript
// actions/products.ts
"use server";

export const createProductAction = action(schema, async (input) => {
  // DB errors propagate — next-safe-action catches and returns them
  const product = await db.insert(productsTable).values(input).returning();
  return product;
});
```

**Rules:**
- Let DB errors propagate naturally
- next-safe-action catches thrown errors and returns them as `result.serverError`
- Server actions NEVER throw across the network boundary

---

## Tier 2: Server Action Validation

next-safe-action handles Zod validation automatically. Invalid inputs are returned as `result.validationErrors`:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { createProductAction } from "@/actions/products";

function CreateProductForm() {
  const { execute, result } = useAction(createProductAction);

  // result.validationErrors — typed field-level errors from Zod
  // result.serverError — string from caught throw inside the action
  // result.data — success response

  // ...
}
```

**Rules:**
- Zod schema on the action defines the validation — no manual validation needed
- Validation errors are automatically typed and returned to the client
- Never throw inside server actions for expected validation failures

---

## Tier 3: Component-Level Catch with Toast

For server actions, there is no `try/catch` at the call site. Errors come through `result`:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { toast } from "sonner"; // shadcn/ui toast

function CreateProductForm() {
  const { execute, result, status } = useAction(createProductAction);

  // React to errors
  useEffect(() => {
    if (result.serverError) {
      toast.error(result.serverError);
    }
    if (result.validationErrors) {
      toast.error("Validation failed — check your input");
    }
  }, [result]);

  // ...
}
```

For non-action async operations (external API calls), use `try/catch`:

```typescript
try {
  const data = await fetchExternalApi();
} catch (error: unknown) {
  toast.error(error instanceof Error ? error.message : "An error occurred");
}
```

---

## Next.js Error Boundaries

For uncaught errors in server components, use Next.js `error.tsx`:

```typescript
// app/products/error.tsx
"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Rules:**
- `error.tsx` catches errors from server components in the same segment
- `reset()` retries rendering the segment
- Do NOT use `error.tsx` for server action errors — those come through `result.serverError`
- Do NOT use `error.tsx` for form validation errors — those come through `result.validationErrors`

---

## Toast Service (sonner)

Use `sonner` (shadcn/ui toast) for client-side notifications:

```typescript
import { toast } from "sonner";

toast.success("Product created");     // green
toast.info("Processing...");          // blue
toast.error("Something failed");      // red
```

---

## Rules Summary

### ✅ DO
- Use next-safe-action for server mutations — errors are returned, not thrown
- Read server action errors from `result.serverError`, `result.validationErrors`
- Use `error.tsx` for server component rendering errors
- Use `sonner` toast for client-side feedback
- Use `try/catch` only for external API calls (not for server actions)

### ❌ DON'T
- Don't define custom error classes — use `new Error(message)` in implementations
- Don't wrap server action calls in `try/catch` — errors come through `result`
- Don't catch errors silently — always show feedback via toast
- Don't log errors to console in production paths
- Don't use `error.tsx` for server action or form validation errors

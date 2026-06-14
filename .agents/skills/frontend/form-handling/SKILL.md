---
name: form-handling
description: Build forms using TanStack Form with Zod — `formOptions`, `useForm` with `validators`, render-prop `form.Field`, and next-safe-action for submission
---

# Form Handling

> This skill covers `@tanstack/react-form` with `next-safe-action` integration.

Every form follows a consistent pattern:

1. **Schema** — Define a Zod schema for validation
2. **Action** — Create a next-safe-action server action with the same schema
3. **Form** — Set up `useForm` with `validators`
4. **Fields** — Use `form.Field` with render prop + `FieldInfo` for errors
5. **Submit** — Execute the server action and handle results

---

## Zod Schema + Type Inference

Define the schema and infer the TypeScript type — **shared between the form and the server action**:

```typescript
import { z } from "zod";

const formSchema = z.object({
  email: z.string().trim().email(),
  password: z
    .string()
    .trim()
    .min(8, "Must be at least 8 characters")
    .max(32, "Must be at most 32 characters"),
});
type FormSchema = z.infer<typeof formSchema>;
```

**Rules:**
- Schema and type are co-located in the component file (not extracted)
- Use `z.infer<typeof formSchema>` — never write the type manually
- Use `.trim()` on all string fields
- Provide user-facing error messages in `.min()`, `.max()`, etc.

---

## Server Action with next-safe-action

Define the server action using the **same schema**:

```typescript
// actions/auth.ts
"use server";

import { action } from "next-safe-action";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().trim().min(8).max(32),
});

export const loginAction = action(loginSchema, async ({ email, password }) => {
  // Server-side authentication logic
  const user = await authenticateUser(email, password);
  return { success: true, user };
});
```

**Rules:**
- Schema can be shared or duplicated — the action validates again on the server
- next-safe-action automatically returns typed `result.validationErrors` and `result.serverError`
- Never throw from a server action — return error data or let next-safe-action catch throws

---

## Shared Form Options with `formOptions`

When the same form config is reused across multiple locations, create shared options with `formOptions()`:

```typescript
import { formOptions } from "@tanstack/react-form";

export const loginFormOptions = formOptions({
  defaultValues: {
    email: "",
    password: "",
  },
  validators: {
    onChange: formSchema,
  },
});
```

For single-use forms, inline the config directly in `useForm`.

---

## useForm Setup with Zod Validators

```typescript
import { useForm } from "@tanstack/react-form";

const form = useForm({
  validators: {
    onChange: formSchema,
  },
  defaultValues: {
    email: "",
    password: "",
  },
});
```

---

## Basic Fields with `form.Field` Render Prop

Every field uses `form.Field` with a children render prop:

```typescript
<form.Field
  name="email"
  children={(field) => (
    <label>
      Email:
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        type="text"
      />
      <FieldInfo field={field} />
    </label>
  )}
/>
```

**Rules:**
- `field.state.value` — current field value
- `field.handleChange(value)` — set the field value
- `field.handleBlur()` — mark field as touched
- `field.state.meta.isTouched` — has the field been blurred?
- `field.state.meta.errors` — array of validation error strings

---

## FieldInfo Helper Component

Extract error rendering into a reusable `FieldInfo` component:

```typescript
type FieldInfoProps = {
  field: {
    state: {
      meta: {
        isTouched: boolean;
        errors: string[];
      };
    };
  };
};

function FieldInfo({ field }: FieldInfoProps) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) {
    return null;
  }
  return (
    <span role="alert">{field.state.meta.errors.join(", ")}</span>
  );
}
```

---

## Submission with next-safe-action

Use `useAction` from next-safe-action in the form submission handler:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { useForm, useStore } from "@tanstack/react-form";
import { toast } from "sonner";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
  const { execute, result, status } = useAction(loginAction);

  const form = useForm({
    validators: { onChange: formSchema },
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      const res = await execute(value);

      if (res?.serverError) {
        toast.error(res.serverError);
        return;
      }
      if (res?.validationErrors) {
        // next-safe-action returns field-level validation errors
        // TanStack Form handles client-side validation, but server might catch more
        toast.error("Validation failed");
        return;
      }

      toast.success("Logged in successfully");
      form.reset();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      {/* fields */}
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting || status === "executing",
        })}
        children={({ isSubmitting }) => (
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Sign In"}
          </button>
        )}
      />
    </form>
  );
}
```

**Rules:**
- Use `useAction(serverAction)` to get `execute`, `result`, `status`
- Call `execute(value)` inside the form's `onSubmit`
- Check `result.serverError` for server-side errors
- Use `status === "executing"` for loading state
- Call `form.reset()` after successful submission

---

## Direct Form Action (Alternative)

For simpler forms, bind the server action directly to the form element:

```typescript
"use client";

import { useAction } from "next-safe-action";
import { loginAction } from "@/actions/auth";
import { toast } from "sonner";

export default function LoginForm() {
  const { execute, result, status } = useAction(loginAction);

  const handleSubmit = async (formData: FormData) => {
    const res = await execute({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (res?.serverError) toast.error(res.serverError);
    else toast.success("Logged in");
  };

  return (
    <form action={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={status === "executing"}>
        {status === "executing" ? "..." : "Sign In"}
      </button>
    </form>
  );
}
```

---

## Select / Complex Widget Fields

For selects and other complex widgets, use `field.handleChange` directly:

```typescript
<form.Field
  name="category"
  children={(field) => (
    <label>
      Category:
      <select
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
      >
        <option value="">Select...</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>
      <FieldInfo field={field} />
    </label>
  )}
/>
```

---

## Reactive Subscriptions with `useStore` / `form.Subscribe`

Subscribe to form-level state outside of fields using `useStore`:

```typescript
import { useStore } from "@tanstack/react-form";

function SubmitButton() {
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  return (
    <button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </button>
  );
}
```

---

## Rules Summary

### ✅ DO
- Define schema + inferred type at the top of the component
- Pass Zod schema to `validators.onChange` on `useForm`
- Use `form.Field` with render prop for all fields
- Use `useAction` from next-safe-action for submission
- Check `result.serverError` and `result.validationErrors` after execute
- Call `form.reset()` after successful submission

### ❌ DON'T
- Don't access errors from a separate `errors` object — read from `field.state.meta.errors`
- Don't write TypeScript types manually — use `z.infer<typeof formSchema>`
- Don't skip `defaultValues` — TanStack Form needs them
- Don't call `onSubmit` directly on the form — use `form.handleSubmit()`
- Don't use raw inputs without `FieldInfo` — always show validation errors
- Don't wrap server action calls in `try/catch` — errors come through `result`

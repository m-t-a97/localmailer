---
name: unit-testing
description: Write tests at two layers for each domain — pure unit tests for factory functions with mocked dependencies, server action tests, and implementation tests with mocked modules
---

# Unit Testing

This pattern uses [Vitest](https://vitest.dev/) with `globals: true` for test runner configuration.

Every domain is tested at **two or three layers** depending on the pattern:

1. **Server action tests** — test next-safe-action server actions with mocked DB
2. **Factory function tests** — test `{domain}.service.ts` by passing mock functions as dependencies
3. **Implementation tests** — test `http-{domain}.service.ts` (external APIs only) by mocking `fetch`

## Test File Location

Tests are co-located with source files:

**Next.js Server Actions:**
```
actions/
├── products.ts
└── products.test.ts              ← Server action tests
```

**Traditional Server-side:**
```
services/{domain}/
├── {domain}.service.ts              ← Factory functions
├── {domain}.service.test.ts         ← Factory tests
```

**Client-side (External APIs):**
```
services/{domain}/
├── {domain}.service.ts              ← Factory functions
├── http-{domain}.service.ts         ← HTTP implementations
├── {domain}.service.test.ts         ← Factory tests
└── http-{domain}.service.test.ts    ← HTTP implementation tests
```

## Layer 0: Server Action Tests (next-safe-action)

Test server actions by calling the action function directly and asserting on the result object:

```typescript
// actions/products.test.ts
import { describe, test, expect, vi } from "vitest";
import { createProductActionFactory } from "./products";
import { createProductSchema } from "@/models/products";

describe("createProductAction", () => {
  test("should create a product and return typed data", async () => {
    const mockDb = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{
            id: "prod-1",
            name: "Test Product",
            price: 29.99,
          }]),
        }),
      }),
    };

    const action = createProductActionFactory(mockDb, createProductSchema);
    const result = await action({ name: "Test Product", price: 29.99 });

    expect(result?.data).toEqual({
      id: "prod-1",
      name: "Test Product",
      price: 29.99,
    });
    expect(result?.validationErrors).toBeUndefined();
    expect(result?.serverError).toBeUndefined();
  });

  test("should return validation errors for invalid input", async () => {
    const action = createProductActionFactory(mockDb, createProductSchema);
    const result = await action({ name: "", price: -1 });

    expect(result?.validationErrors).toBeDefined();
    expect(result?.data).toBeUndefined();
  });
});
```

### ✅ DO — Test server actions by:
1. Creating the action with mocked dependencies
2. Calling the action directly with test input
3. Asserting on the result object (`result.data`, `result.validationErrors`, `result.serverError`)

## Layer 1: Factory Function Tests

### Server-side Factory Test

Test the factory by passing a mock function as the dependency (no URL parameter):

```typescript
// services/products/products.service.test.ts
import { describe, test, expect, vi } from "vitest";
import type { Product } from "@shared";
import { createProductFactory } from "./products.service";

describe("ProductService", () => {
  afterEach(() => { vi.clearAllMocks(); });

  describe("createProductFactory", () => {
    test("should call the dependency function with correct arguments", async () => {
      const mockInput = { name: "Wireless Mouse", categoryId: "cat-1" };
      const mockProduct: Product = { id: "prod-1", name: "Wireless Mouse" };
      const mockCreateProduct = vi.fn().mockResolvedValue(mockProduct);

      const handler = createProductFactory(mockCreateProduct);
      const result = await handler(mockInput);

      expect(result).toEqual(mockProduct);
      expect(mockCreateProduct).toHaveBeenCalledTimes(1);
      expect(mockCreateProduct).toHaveBeenCalledWith(mockInput);
    });
  });
});
```

### Client-side Factory Test (External APIs)

```typescript
// services/products/products.service.test.ts
import { describe, test, expect, vi } from "vitest";
import type { Product, CreateProductInput } from "@shared";
import { createProductFactory } from "./products.service";

describe("ProductService", () => {
  afterEach(() => { vi.clearAllMocks(); });

  describe("createProductFactory", () => {
    test("should call the HTTP function with correct arguments", async () => {
      const mockUrl = "https://api.example.com/products";
      const mockInput: CreateProductInput = { name: "Wireless Mouse" };
      const mockProduct: Product = { id: "prod-1", name: "Wireless Mouse" };
      const mockHttpCreateProduct = vi.fn().mockResolvedValue({ data: mockProduct });

      const handler = createProductFactory(mockUrl, mockHttpCreateProduct);
      const result = await handler(mockInput);

      expect(result).toEqual(mockProduct);
      expect(mockHttpCreateProduct).toHaveBeenCalledTimes(1);
      expect(mockHttpCreateProduct).toHaveBeenCalledWith(mockUrl, mockInput);
    });
  });
});
```

### ✅ DO — Test factory by:
1. Creating mock data and mock dependency function
2. Creating a `vi.fn().mockResolvedValue(mockData)` for the dependency
3. Calling the factory with mocks
4. Calling the returned handler
5. Asserting both the result AND the mock function call arguments

### ❌ DON'T — Test without asserting mock call args:
```typescript
// ❌ DON'T — Missing assertion on what the mock was called with
test("createProductFactory", async () => {
  const handler = createProductFactory(vi.fn().mockResolvedValue("ok"));
  const result = await handler(data);
  expect(result).toBe("ok");
  // Where's the assertion that the mock was called with the right args?
});
```

## Layer 2: HTTP Implementation Tests (External APIs Only)

Test HTTP implementations by mocking `fetch`:

```typescript
// services/products/http-products.service.test.ts
import { describe, test, expect, vi, beforeEach } from "vitest";
import { httpCreateProduct } from "./http-products.service";

describe("HttpProductService", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("httpCreateProduct", () => {
    test("should call fetch and return validated response", async () => {
      const mockUrl = "https://api.example.com/products";
      const mockBody = { name: "Wireless Mouse" };
      const mockResponse = { data: { id: "prod-1", name: "Wireless Mouse" } };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      vi.stubGlobal("fetch", mockFetch);

      const result = await httpCreateProduct(mockUrl, mockBody);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(mockUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockBody),
      });
    });
  });
});
```

## Test Structure Convention

```typescript
// ✅ DO — Standard test structure
describe("DomainName", () => {
  afterEach(() => { vi.clearAllMocks(); });

  describe("functionName", () => {
    test("should ... when ...", async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Test Coverage Expectations

| Layer | What to test | What to mock |
|-------|-------------|--------------|
| Server action (next-safe-action) | Returns typed data on success | Mock DB implementation |
| Server action | Returns validation errors on bad input | No mocking needed |
| Server action | Returns serverError on DB failure | Mock DB to throw |
| Factory function | Returns correct result | Pass `vi.fn()` as dependency |
| Factory function | Passes correct args to dependency | Assert `toHaveBeenCalledWith` |
| HTTP implementation | Returns mapped response | Mock `fetch` with `vi.stubGlobal` |

## Rules

### ✅ DO
- Test server actions by calling the function and asserting the result object
- Use `vi.fn()` for factory dependency injection (no module mocking needed)
- Use `vi.stubGlobal("fetch", mockFetch)` for HTTP implementation tests
- Use `afterEach(() => vi.clearAllMocks())` or `beforeEach`
- Test both success and error paths
- Assert both return values AND mock function call arguments
- Co-locate test files with source files

### ❌ DON'T
- Don't test the database implementation layer (that's integration/E2E territory)
- Don't put integration-level tests in unit test files
- Don't mock what you don't need to — factory tests don't need module mocking
- Don't forget `vi.clearAllMocks()` between tests
- Don't test next-safe-action internals — test the action function like any other async function

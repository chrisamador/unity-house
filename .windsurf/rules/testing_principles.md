---
trigger: model_decision
description: Testing Guidelines when writing automated tests
---

# Testing Guidelines

## 1. Resemble Real Usage

**Do:**

* Test real user flows (clicks, typing, submitting).
* Assert outcomes users care about (text, status, UI changes).
  **Don’t:**
* Test irrelevant internals or state.
* Write tests just to hit coverage %.

```ts
// ✅ good
await user.click(screen.getByRole("button", { name: /save/i }));
expect(await screen.findByText(/saved/i)).toBeInTheDocument();

// ❌ bad
expect((MyComp as any).__state.loading).toBe(false);
```

---

## 2. Avoid Testing Implementation Details

**Do:**

* Query by text/labels/roles.
* Keep tests resilient to refactors.
  **Don’t:**
* Depend on class names, test IDs, or DOM structure.

```ts
// ✅ good
await user.type(screen.getByLabelText(/name/i), "Ada");

// ❌ bad
const input = container.querySelector(".form-control");
```

---

## 3. Mostly Integration (with a few Unit + E2E)

**Do:**

* Favor integration tests that check multiple pieces together.
* Add unit tests for complex logic.
* Write a few E2E tests for critical paths.
  **Don’t:**
* Overuse unit tests or flood with brittle E2E.

```ts
// ✅ integration
vi.spyOn(api, "fetchBooks").mockResolvedValue([{ id: "1", title: "Clean Code" }]);
await user.type(screen.getByLabelText(/search/i), "code");
await user.click(screen.getByRole("button", { name: /go/i }));
expect(await screen.findByText(/clean code/i)).toBeInTheDocument();

// ❌ bad: brittle e2e
await page.click(".btn-123");
```

---

## 4. Follow Testing Library’s Guiding Principles

**Do:**

* Query elements the way users find them (role, label, text).
* Focus on behavior over structure.
  **Don’t:**
* Snapshot test UI.
* Assert on framework internals.

```ts
// ✅ good
await user.click(screen.getByRole("checkbox", { name: /email notifications/i }));
expect(await screen.findByText(/preferences saved/i)).toBeInTheDocument();

// ❌ bad
expect(container).toMatchSnapshot();
// ❌ bad Prefer role/label/text over testid unless there’s no accessible alternative
screen.getByTestId("notify-checkbox").click();

```


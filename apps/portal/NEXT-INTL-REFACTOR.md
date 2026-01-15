# next-intl Best Practice Refactor Plan

## Goal

Refactor from `useExtracted()` in Client Components to `getExtracted()` in Server Components with props passing.

## Current State

- **51+ files** use `useExtracted()` client-side
- **3 files** use `getExtracted()` server-side
- **`NextIntlClientProvider`** passes ALL messages to client
- **Pages** delegate to Client Components with NO translation props

## Target State

- **Server Components** call `getExtracted()` and pass translated strings as props
- **Client Components** receive translations via props, no `useExtracted()` calls
- **`NextIntlClientProvider`** with `messages={null}` - nothing sent to client
- **`generateMetadata`** for localized SEO on key pages

---

## Implementation Steps

### Phase 1: Create Translation Props Pattern

**1.1 Create shared type utility** (`apps/portal/src/types/i18n.ts`)

```typescript
// Generic translation props type for components
export type TranslationProps<T extends Record<string, string>> = {
  t: T;
};
```

**1.2 Example refactored component pattern:**

```typescript
// Before: Client Component with useExtracted()
"use client";
import { useExtracted } from "next-intl";

export function HomePage() {
  const t = useExtracted();
  return <h1>{t("Welcome")}</h1>;
}

// After: Client Component receiving props
"use client";

interface HomePageProps {
  t: {
    welcome: string;
    description: string;
  };
}

export function HomePage({ t }: HomePageProps) {
  return <h1>{t.welcome}</h1>;
}
```

**1.3 Server page pattern:**

```typescript
// Before
export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <HomePage />;
}

// After
import { getExtracted } from "next-intl/server";

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getExtracted();

  return (
    <HomePage
      t={{
        welcome: t("Welcome"),
        description: t("Your simulation toolkit"),
      }}
    />
  );
}
```

---

### Phase 2: Refactor Components (Priority Order)

#### Tier 1: Simple Components (Low Translation Count)

| Component   | File                                         | Translation Count | Complexity |
| ----------- | -------------------------------------------- | ----------------- | ---------- |
| HomePage    | `components/home/home-page.tsx`              | 6                 | Low        |
| BlogList    | `components/blog/blog-list.tsx`              | 1                 | Low        |
| ResultsStep | `components/simulate/steps/results-step.tsx` | 3                 | Low        |
| DevIndex    | `components/dev/dev-index.tsx`               | ~3                | Low        |

#### Tier 2: Medium Components

| Component       | File                                           | Translation Count | Complexity |
| --------------- | ---------------------------------------------- | ----------------- | ---------- |
| SignInForm      | `components/auth/sign-in-form.tsx`             | 6 + rich          | Medium     |
| ConfigureStep   | `components/simulate/steps/configure-step.tsx` | 14                | Medium     |
| ImportStep      | `components/simulate/steps/import-step.tsx`    | 2                 | Low        |
| SimulateWizard  | `components/simulate/simulate-wizard.tsx`      | 3                 | Medium     |
| UserProfilePage | `components/users/user-profile-page.tsx`       | ~5                | Medium     |

#### Tier 3: Complex Components (High Translation Count)

| Component       | File                                         | Translation Count | Complexity |
| --------------- | -------------------------------------------- | ----------------- | ---------- |
| RotationBrowser | `components/rotations/rotation-browser.tsx`  | 20+               | High       |
| EditorHeader    | `components/editor/layout/editor-header.tsx` | 15+               | High       |
| AppSidebar      | `components/layout/app-sidebar.tsx`          | 5+                | Medium     |
| Navbar          | `components/layout/navbar.tsx`               | 4                 | Medium     |
| UserMenu        | `components/layout/user-menu.tsx`            | 3                 | Low        |

#### Tier 4: Layout-Level Components

These require special handling as they're in root layout:

- `providers/app-providers.tsx` - Update to `messages={null}`
- `app/[locale]/layout.tsx` - Remove `getMessages()` call

---

### Phase 3: Handle Special Cases

**3.1 Rich Text (`t.rich()`):**
Components using `t.rich()` (e.g., SignInForm) need the `rich` helper passed:

```typescript
interface SignInFormProps {
  t: {
    signingIn: string;
    title: string;
    // For rich text, pass the raw string + components render on client
    termsText: string;
  };
  richComponents: {
    terms: (chunks: ReactNode) => ReactNode;
    privacy: (chunks: ReactNode) => ReactNode;
  };
}
```

**3.2 Conditional Translations:**
Components with conditional text (e.g., `isNew ? t("Create") : t("Save")`) need ALL variants passed:

```typescript
interface EditorHeaderProps {
  t: {
    create: string;
    save: string;
    // Pass both, component chooses based on state
  };
}
```

**3.3 Plural Forms:**

```typescript
// Server side
const t = await getExtracted();
// Pass the plural function result for each count scenario
// OR pass a formatter function
```

---

### Phase 4: Update NextIntlClientProvider

**File:** `apps/portal/src/app/[locale]/layout.tsx`

```typescript
// Before
const messages = await getMessages();
<AppProviders locale={locale} messages={messages}>

// After
<AppProviders locale={locale} messages={null}>
```

**File:** `apps/portal/src/providers/app-providers.tsx`

- Update type to accept `messages: null`

---

### Phase 5: Add generateMetadata

**Key pages to add localized metadata:**

- `apps/portal/src/app/[locale]/(home)/page.tsx`
- `apps/portal/src/app/[locale]/simulate/page.tsx`
- `apps/portal/src/app/[locale]/rotations/(index)/page.tsx`

```typescript
import { getExtracted } from "next-intl/server";

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getExtracted();

  return {
    title: t("Simulate - WoW Lab"),
    description: t("Run quick simulations for your character"),
  };
}
```

---

## Files to Modify (Complete List)

### Types

- [ ] `apps/portal/src/types/i18n.ts` (new)

### Pages (add getExtracted + props)

- [ ] `apps/portal/src/app/[locale]/(home)/page.tsx`
- [ ] `apps/portal/src/app/[locale]/auth/sign-in/page.tsx`
- [ ] `apps/portal/src/app/[locale]/blog/(index)/page.tsx`
- [ ] `apps/portal/src/app/[locale]/computing/page.tsx`
- [ ] `apps/portal/src/app/[locale]/dev/(index)/page.tsx`
- [ ] `apps/portal/src/app/[locale]/dev/hooks/page.tsx`
- [ ] `apps/portal/src/app/[locale]/dev/ui/page.tsx`
- [ ] `apps/portal/src/app/[locale]/plan/(index)/page.tsx`
- [ ] `apps/portal/src/app/[locale]/rotations/(index)/page.tsx`
- [ ] `apps/portal/src/app/[locale]/rotations/browse/page.tsx`
- [ ] `apps/portal/src/app/[locale]/simulate/page.tsx`
- [ ] `apps/portal/src/app/[locale]/users/[handle]/page.tsx`

### Components (remove useExtracted, add props)

- [ ] `apps/portal/src/components/home/home-page.tsx`
- [ ] `apps/portal/src/components/auth/sign-in-form.tsx`
- [ ] `apps/portal/src/components/blog/blog-list.tsx`
- [ ] `apps/portal/src/components/computing/computing-content.tsx`
- [ ] `apps/portal/src/components/computing/cards/*.tsx` (multiple)
- [ ] `apps/portal/src/components/dev/dev-index.tsx`
- [ ] `apps/portal/src/components/dev/hooks-demo.tsx`
- [ ] `apps/portal/src/components/dev/ui-demo.tsx`
- [ ] `apps/portal/src/components/plan/plan-index.tsx`
- [ ] `apps/portal/src/components/rotations/rotations-index.tsx`
- [ ] `apps/portal/src/components/rotations/rotation-browser.tsx`
- [ ] `apps/portal/src/components/simulate/simulate-wizard.tsx`
- [ ] `apps/portal/src/components/simulate/steps/*.tsx` (multiple)
- [ ] `apps/portal/src/components/users/user-profile-page.tsx`
- [ ] `apps/portal/src/components/layout/navbar.tsx`
- [ ] `apps/portal/src/components/layout/app-sidebar.tsx`
- [ ] `apps/portal/src/components/layout/user-menu.tsx`
- [ ] `apps/portal/src/components/editor/layout/editor-header.tsx`

### Layout/Provider

- [ ] `apps/portal/src/app/[locale]/layout.tsx`
- [ ] `apps/portal/src/providers/app-providers.tsx`

### Error Pages (special - must keep useExtracted)

- [ ] `apps/portal/src/app/error.tsx` - Keep useExtracted (error boundary requirement)
- [ ] `apps/portal/src/app/[locale]/error.tsx` - Keep useExtracted

---

## Verification

1. **Build check:** `pnpm build` - no type errors
2. **Dev mode:** `pnpm dev` - pages render correctly
3. **Network tab:** Verify no messages JSON in initial HTML payload
4. **Locale switching:** Test EN/DE switching still works
5. **Interactive features:** Test forms, wizards, editors still function

---

## Notes

- **Error pages** (`error.tsx`) MUST use `useExtracted()` - Next.js requirement
- **Editor pages** (`rotations/editor/`) are Client Components at page level - need different strategy
- **Estimated files:** ~40-50 files to modify
- **No breaking changes** to user-facing functionality

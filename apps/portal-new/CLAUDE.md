# apps/portal-new

Next.js 16 app with Pico CSS and Base UI components.

## Route Architecture

**Every route MUST have these 3 files:**

```
app/feature/
  layout.tsx    # PageLayout with title/breadcrumbs
  page.tsx      # Minimal, renders component from components/page/feature
  loading.tsx   # Skeleton inline, uses Skeleton primitive
```

**Components mirror routes:**

```
components/page/feature/
  index.tsx     # FeatureContent component
```

## Creating a New Route

1. `app/feature/layout.tsx`:

```tsx
import { PageLayout } from "@/components/layout";

export default function FeatureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageLayout
      title="Feature"
      description="Description here"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Feature" }]}
    >
      {children}
    </PageLayout>
  );
}
```

2. `app/feature/page.tsx`:

```tsx
import { FeatureContent } from "@/components/page/feature";

export default function FeaturePage() {
  return <FeatureContent />;
}
```

3. `app/feature/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function FeatureLoading() {
  return <Skeleton height="10rem" />;
}
```

4. `components/page/feature/index.tsx`:

```tsx
export function FeatureContent() {
  return <div>...</div>;
}
```

## File Structure

```
src/
  app/
    layout.tsx      # Root: SiteShell
    (home)/
      layout.tsx, page.tsx, loading.tsx
    demo/
      layout.tsx, page.tsx, loading.tsx
    simulate/
      layout.tsx, page.tsx, loading.tsx
  components/
    layout/         # SiteShell, Sidebar, Navbar, PageLayout, PageHeader
    page/
      simulate/     # mirrors app/simulate
        index.tsx
    ui/
      skeleton/
```

## Skeleton Primitive

```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton />                                // Full width, 1rem height
<Skeleton width="5rem" height="1.25rem" />  // Custom size
```

## Key Conventions

- Every route: `layout.tsx` + `page.tsx` + `loading.tsx`
- Components in `components/page/` mirror route structure
- Pages are minimal: just render a component
- Skeletons go directly in `loading.tsx`

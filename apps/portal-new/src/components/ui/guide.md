# Adding Base UI Components

This guide explains how to wrap Base UI components with Pico CSS styling.

## Structure

Each component lives in `src/components/ui/<component>/`:

```
src/components/ui/
├── accordion/
│   ├── index.tsx        # Component exports
│   └── index.module.css # Minimal styles
├── dialog/
│   ├── index.tsx
│   └── index.module.css
└── ...
```

## Pattern

1. **Re-export parts that don't need styling** directly from Base UI
2. **Wrap parts that need styling** with `clsx` for className merging

```tsx
import { ComponentName } from '@base-ui/react/component-name';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import styles from './index.module.css';

// Re-export unstyled parts directly
export const Root = ComponentName.Root;
export const Item = ComponentName.Item;

// Wrap parts that need styling
export function Trigger({ className, ...props }: ComponentProps<typeof ComponentName.Trigger>) {
  return <ComponentName.Trigger className={clsx(styles.trigger, className)} {...props} />;
}
```

## CSS Guidelines

Use Pico CSS variables for consistency:

```css
/* Colors */
var(--pico-primary)
var(--pico-secondary)
var(--pico-muted-color)
var(--pico-color)

/* Borders */
var(--pico-border-color)
var(--pico-muted-border-color)

/* Backgrounds */
var(--pico-background-color)
var(--pico-card-background-color)

/* Spacing */
var(--pico-spacing)
var(--pico-block-spacing-vertical)
```

Reset browser/Pico button styles when needed:

```css
.trigger {
  all: unset;
  cursor: pointer;
  /* your styles */
}
```

## Adding a New Component

### 1. Create the directory

```bash
mkdir -p src/components/ui/<component-name>
```

### 2. Check Base UI docs for component parts

Visit: `https://base-ui.com/react/components/<component-name>.md`

Example parts for Dialog:
- `Dialog.Root`
- `Dialog.Trigger`
- `Dialog.Portal`
- `Dialog.Backdrop`
- `Dialog.Popup`
- `Dialog.Title`
- `Dialog.Description`
- `Dialog.Close`

### 3. Create index.tsx

```tsx
import { Dialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';
import type { ComponentProps } from 'react';
import styles from './index.module.css';

// Re-export parts that don't need custom styles
export const Root = Dialog.Root;
export const Trigger = Dialog.Trigger;
export const Portal = Dialog.Portal;
export const Title = Dialog.Title;
export const Description = Dialog.Description;
export const Close = Dialog.Close;

// Wrap parts that need styling
export function Backdrop({ className, ...props }: ComponentProps<typeof Dialog.Backdrop>) {
  return <Dialog.Backdrop className={clsx(styles.backdrop, className)} {...props} />;
}

export function Popup({ className, ...props }: ComponentProps<typeof Dialog.Popup>) {
  return <Dialog.Popup className={clsx(styles.popup, className)} {...props} />;
}
```

### 4. Create index.module.css

Keep styles minimal - let Pico handle typography and base styles:

```css
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
}

.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--pico-card-background-color);
  border-radius: var(--pico-border-radius);
  padding: var(--pico-spacing);
}
```

### 5. Usage

```tsx
import * as Dialog from '@/components/ui/dialog';

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Popup>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Content here</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

## Available Base UI Components

Reference: https://base-ui.com/react/components

Common ones to add:
- `dialog` - Modals
- `popover` - Floating content
- `menu` - Dropdown menus
- `select` - Dropdowns
- `tabs` - Tab panels
- `tooltip` - Hints
- `switch` - Toggle switches
- `checkbox` - Checkboxes
- `radio` - Radio buttons
- `input` - Text inputs
- `field` - Form field wrapper with labels/errors

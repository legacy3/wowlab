---
name: park-ui
description: Use Park UI components in portal-new. Check this skill before implementing UI to find the right component.
---

# Park UI Components

Components live in `apps/portal-new/src/components/ui/`.

## Examples

**Read the demo files for working examples:**

```
apps/portal-new/src/components/dev/ui/sections/
├── forms.tsx        # Input, Field, Select, Combobox, Switch, NumberInput
├── overlays.tsx     # Tooltip, Dialog, Drawer, Popover, Menu
├── navigation.tsx   # Link, Tabs, Accordion, Collapsible, Expandable
├── feedback.tsx     # Loader, Skeleton
├── data-display.tsx # Code, Kbd, Table, Card, Badge, Avatar
├── actions.tsx      # Button, IconButton
└── tokens.tsx       # Typography, Colors, Icon, Group, AbsoluteCenter
```

## Component Lookup

| Component        | When to Use                                | Installed |
| ---------------- | ------------------------------------------ | --------- |
| `AbsoluteCenter` | Center content in relative parent          | YES       |
| `Accordion`      | Collapsible sections, FAQ lists            | YES       |
| `Alert`          | Important messages, warnings, errors       | NO        |
| `Avatar`         | User profile images, initials              | YES       |
| `Badge`          | Status indicators, tags, counts            | YES       |
| `Breadcrumb`     | Navigation hierarchy, page location        | NO        |
| `Button`         | User actions, form submissions             | YES       |
| `Card`           | Content containers, list items             | YES       |
| `Carousel`       | Image galleries, slideshows                | NO        |
| `Checkbox`       | Multi-select options, boolean in forms     | NO        |
| `Clipboard`      | Copy to clipboard functionality            | NO        |
| `Code`           | Inline code snippets                       | YES       |
| `Collapsible`    | Show/hide single section                   | YES       |
| `ColorPicker`    | Color selection input                      | NO        |
| `Combobox`       | Searchable dropdown, autocomplete          | YES       |
| `DatePicker`     | Date/time selection                        | NO        |
| `Dialog`         | Modal windows, confirmations               | YES       |
| `Drawer`         | Side panels, mobile nav                    | YES       |
| `Editable`       | Inline text editing                        | NO        |
| `Expandable`     | Click-to-expand images/diagrams fullscreen | YES       |
| `Field`          | Form field wrapper (label, error, hint)    | YES       |
| `Fieldset`       | Group related form fields                  | NO        |
| `FileUpload`     | File input, drag-and-drop uploads          | NO        |
| `Group`          | Group elements with consistent spacing     | YES       |
| `Heading`        | Section titles (h1-h6)                     | YES       |
| `HoverCard`      | Rich content on hover                      | NO        |
| `Icon`           | Icon wrapper with sizing                   | YES       |
| `Image`          | Optimized image display                    | YES       |
| `Input`          | Text input fields                          | YES       |
| `InputAddon`     | Input prefix/suffix (icons, units)         | NO        |
| `InputGroup`     | Grouped inputs with addons                 | NO        |
| `Kbd`            | Keyboard shortcut display                  | YES       |
| `Link`           | Navigation links                           | YES       |
| `Loader`         | Loading states (flask animation)           | YES       |
| `Menu`           | Dropdown menus, context menus              | YES       |
| `NumberInput`    | Numeric input with +/- buttons             | YES       |
| `Pagination`     | Page navigation for lists                  | NO        |
| `PinInput`       | OTP/PIN code entry                         | NO        |
| `Popover`        | Floating content on click                  | YES       |
| `Progress`       | Progress bars, completion indicators       | NO        |
| `Prose`          | Long-form content styling                  | YES       |
| `RadioCardGroup` | Card-style radio buttons                   | NO        |
| `RadioGroup`     | Single-select options                      | NO        |
| `RatingGroup`    | Star ratings, feedback                     | NO        |
| `ScrollArea`     | Custom scrollable containers               | NO        |
| `SegmentGroup`   | Segmented control buttons                  | NO        |
| `Select`         | Dropdown selection                         | YES       |
| `Skeleton`       | Loading placeholders                       | YES       |
| `Slider`         | Range input, volume controls               | NO        |
| `Spinner`        | Simple spinning loader                     | NO        |
| `Splitter`       | Resizable panels                           | NO        |
| `Switch`         | Boolean toggles                            | YES       |
| `Table`          | Tabular data                               | YES       |
| `Tabs`           | Tab navigation                             | YES       |
| `TagsInput`      | Multiple tag entry                         | NO        |
| `Text`           | Body text with variants                    | YES       |
| `Textarea`       | Multi-line text input                      | NO        |
| `Toast`          | Temporary notifications                    | NO        |
| `ToggleGroup`    | Multi-select button group                  | NO        |
| `Tooltip`        | Hover hints                                | YES       |

## Import

```tsx
import { Button, Badge, Input, Text, Tooltip } from "@/components/ui";
import { Card, Dialog, Select, Menu, Tabs } from "@/components/ui";
```

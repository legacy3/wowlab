export const conditions = {
  extend: {
    active: "&:not(:disabled):active",
    checked:
      "&:is(:checked, [data-checked], [data-state=checked], [aria-checked=true], [data-state=indeterminate])",
    hover: "&:not(:disabled):hover",
    invalid: "&:is(:user-invalid, [data-invalid], [aria-invalid=true])",
    light: ":root &, .light &",
    on: "&:is([data-state=on])",
    pinned: "&:is([data-pinned])",
  },
} as const;

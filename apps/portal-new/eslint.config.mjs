import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import perfectionist from "eslint-plugin-perfectionist";
import { defineConfig, globalIgnores } from "eslint/config";

const sortClassGroups = [
  "index-signature",
  ["static-property", "static-accessor-property"],
  "static-block",
  "static-get-method",
  "static-set-method",
  "static-method",
  ["property", "accessor-property"],
  ["protected-property", "protected-accessor-property"],
  ["private-property", "private-accessor-property"],
  "constructor",
  "get-method",
  "set-method",
  "method",
  "protected-get-method",
  "protected-set-method",
  "protected-method",
  "private-get-method",
  "private-set-method",
  "private-method",
  "unknown",
];

const routingRules = {
  "no-restricted-syntax": [
    "warn",
    {
      message: "Use href={href(routes.xxx)} instead of string literals.",
      selector: 'JSXAttribute[name.name="href"][value.type="Literal"]',
    },
  ],
};

const perfectionistRules = {
  "perfectionist/sort-array-includes": ["warn"],
  "perfectionist/sort-classes": ["warn", { groups: sortClassGroups }],
  "perfectionist/sort-decorators": ["warn"],
  "perfectionist/sort-enums": ["warn", { partitionByComment: true }],
  "perfectionist/sort-exports": ["warn"],
  "perfectionist/sort-heritage-clauses": ["warn"],
  "perfectionist/sort-imports": ["warn"],
  "perfectionist/sort-interfaces": ["warn"],
  "perfectionist/sort-intersection-types": ["warn"],
  "perfectionist/sort-maps": ["warn", { partitionByComment: true }],
  "perfectionist/sort-modules": ["warn"],
  "perfectionist/sort-named-exports": ["warn"],
  "perfectionist/sort-named-imports": ["warn"],
  "perfectionist/sort-objects": ["warn", { partitionByComment: true }],
  "perfectionist/sort-sets": ["warn", { partitionByComment: true }],
  "perfectionist/sort-switch-case": ["warn"],
  "perfectionist/sort-variable-declarations": ["warn"],
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { perfectionist },
    rules: { ...perfectionistRules, ...routingRules },
  },
]);

export default eslintConfig;

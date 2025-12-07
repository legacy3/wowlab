import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import effectPlugin from "@effect/eslint-plugin";
import perfectionist from "eslint-plugin-perfectionist";

const sortClassGroups = [
  // Index signature typically comes first
  "index-signature",

  // Static members (across all access levels)
  ["static-property", "static-accessor-property"],
  "static-block",
  "static-get-method",
  "static-set-method",
  "static-method",

  // Properties (all access levels)
  ["property", "accessor-property"],
  ["protected-property", "protected-accessor-property"],
  ["private-property", "private-accessor-property"],

  // Constructor
  "constructor",

  // Public methods and accessors
  "get-method",
  "set-method",
  "method",

  // Protected methods and accessors
  "protected-get-method",
  "protected-set-method",
  "protected-method",

  // Private methods and accessors
  "private-get-method",
  "private-set-method",
  "private-method",

  // Unknown (keeping at the end)
  "unknown",
];

// Shared base rules for all TypeScript files
const baseTypeScriptRules = {
  // Disable base rules to avoid conflicts with TypeScript versions
  "no-unused-vars": "off",
  "no-undef": "off", // TypeScript handles this

  // TypeScript recommended rules
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-non-null-assertion": "warn",

  // Perfectionist rules for consistent code organization
  "perfectionist/sort-array-includes": ["warn"],
  "perfectionist/sort-classes": ["warn", { groups: sortClassGroups }],
  "perfectionist/sort-decorators": ["warn"],
  "perfectionist/sort-enums": ["warn", { partitionByComment: true }],
  "perfectionist/sort-exports": ["warn", { groupKind: "values-first" }],
  "perfectionist/sort-heritage-clauses": ["warn"],
  "perfectionist/sort-imports": ["warn"],
  "perfectionist/sort-interfaces": ["warn"],
  "perfectionist/sort-intersection-types": ["warn"],
  // "perfectionist/sort-jsx-props": ["warn"],
  "perfectionist/sort-maps": ["warn", { partitionByComment: true }],
  "perfectionist/sort-modules": ["warn"],
  "perfectionist/sort-named-exports": ["warn", { groupKind: "values-first" }],
  "perfectionist/sort-named-imports": ["warn", { groupKind: "values-first" }],
  // "perfectionist/sort-object-types": ["warn"],
  "perfectionist/sort-objects": ["warn", { partitionByComment: true }],
  "perfectionist/sort-sets": ["warn", { partitionByComment: true }],
  "perfectionist/sort-switch-case": ["warn"],
  // "perfectionist/sort-union-types": ["warn"],
  "perfectionist/sort-variable-declarations": ["warn"],
};

// Shared base plugins for all TypeScript files
const baseTypeScriptPlugins = {
  "@typescript-eslint": tseslint,
  "@effect": effectPlugin,
  perfectionist,
};

export default [
  // Global ignores
  {
    ignores: [
      "**/build/**",
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/.react-router/**", // React Router generated types
      "**/apps/*/build/**",
      "**/apps/*/dist/**",
      "**/rotations/code/**", // Example rotation scripts
      "**/third_party/**", // Third-party code
      "**/docs/**", // Documentation
    ],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // TypeScript configuration for source files
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.app.json",
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: baseTypeScriptPlugins,
    rules: {
      ...baseTypeScriptRules,

      // Effect rules - warn about barrel imports (can be refactored later)
      "@effect/no-import-from-barrel-package": [
        "warn",
        {
          packageNames: ["effect", "@effect/platform", "@effect/sql"],
        },
      ],
    },
  },

  // Branded IDs file - allow redeclaration for type+constructor pattern
  {
    files: ["**/branded/ids.ts"],
    rules: {
      "no-redeclare": "off",
    },
  },

  // Combat log files - allow redeclaration for Effect Schema type+value pattern
  {
    files: ["**/combat-log/*.ts"],
    rules: {
      "no-redeclare": "off",
    },
  },

  // Config files without TypeScript project
  {
    files: ["*.config.ts", "*.config.mts", "*.config.js", "*.config.mjs"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Test files configuration
  {
    files: ["test/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.test.json",
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: baseTypeScriptPlugins,
    rules: {
      ...baseTypeScriptRules,

      // Relax some rules for tests
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // App packages
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: baseTypeScriptPlugins,
    rules: {
      ...baseTypeScriptRules,

      // Effect rules - warn about barrel imports
      "@effect/no-import-from-barrel-package": [
        "warn",
        {
          packageNames: ["effect", "@effect/platform", "@effect/sql"],
        },
      ],
    },
  },

  // Package and script files
  {
    files: ["packages/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
    },
    plugins: baseTypeScriptPlugins,
    rules: {
      ...baseTypeScriptRules,
    },
  },
];

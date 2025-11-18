import { atom } from "jotai";

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: "feature" | "improvement" | "fix" | "breaking";
    title: string;
    description?: string;
  }[];
}

const MOCK_CHANGELOG: ChangelogEntry[] = [
  {
    version: "v2.1.0",
    date: "2025-11-15",
    changes: [
      {
        type: "feature",
        title: "DPS Rankings with Item Tooltips",
        description:
          "Added comprehensive DPS rankings page with interactive tooltips that display detailed item information, bonuses, and stat comparisons. Hover over any item to see its full details and how it impacts your performance.",
      },
      {
        type: "feature",
        title: "Spell Data Viewer",
        description:
          "New spell data viewer with dynamic formatters for all spell properties. Browse and search through all spell data with intelligent formatting based on property types.",
      },
      {
        type: "improvement",
        title: "Rotation Detail Performance Visualization",
        description:
          "Enhanced the rotation detail page with better performance graphs and metrics visualization. Now includes timeline breakdowns and ability usage statistics.",
      },
      {
        type: "fix",
        title: "Auth Callback URL Configuration",
        description:
          "Fixed authentication callback URLs to properly use APP_URL from environment configuration instead of hardcoded values.",
      },
    ],
  },
  {
    version: "v2.0.0",
    date: "2025-11-01",
    changes: [
      {
        type: "breaking",
        title: "Effect-TS 3.x Migration",
        description:
          "Major migration to Effect-TS 3.x with comprehensive schema validation. This introduces breaking changes to the API layer and requires updates to custom rotation scripts. See migration guide for details.",
      },
      {
        type: "feature",
        title: "User Rotation History",
        description:
          "Track all your rotation simulations with detailed performance metrics over time. View historical data, compare runs, and analyze improvement trends.",
      },
      {
        type: "feature",
        title: "Drop Optimizer",
        description:
          "New drop optimizer tool that analyzes potential gear upgrades from upcoming bosses and suggests the best items to target based on your current setup.",
      },
      {
        type: "improvement",
        title: "Navigation Redesign",
        description:
          "Complete redesign of the navigation system with an improved sidebar, better mobile menu, and clearer organization of features.",
      },
    ],
  },
  {
    version: "v1.8.2",
    date: "2025-10-28",
    changes: [
      {
        type: "improvement",
        title: "CI Workflow Optimization",
        description:
          "Updated CI workflow to build only specific packages instead of the entire monorepo, resulting in 40% faster deployment times.",
      },
      {
        type: "fix",
        title: "GitHub Repository URL",
        description:
          "Corrected GitHub repository URL in environment configuration.",
      },
      {
        type: "fix",
        title: "Rotation Execution Type Errors",
        description:
          "Resolved type errors in the rotation execution engine that were causing build warnings.",
      },
    ],
  },
  {
    version: "v1.8.0",
    date: "2025-10-20",
    changes: [
      {
        type: "feature",
        title: "Rotation Workbench",
        description:
          "Added workbench page for testing and experimenting with rotations in a sandbox environment. Try out different abilities and see real-time DPS calculations.",
      },
      {
        type: "feature",
        title: "Advanced Charts",
        description:
          "New charts page with advanced DPS visualization including ability breakdowns, resource usage, and proc tracking.",
      },
      {
        type: "improvement",
        title: "Priority Queue Optimization",
        description:
          "Enhanced spell rotation simulation engine with priority queue optimization for better performance on complex rotations.",
      },
    ],
  },
  {
    version: "v1.7.5",
    date: "2025-10-12",
    changes: [
      {
        type: "improvement",
        title: "Rotation Creation Flow",
        description:
          "Improved rotation creation with better validation, error handling, and helpful feedback messages throughout the process.",
      },
      {
        type: "fix",
        title: "Namespace Page Rendering",
        description:
          "Fixed rendering issues on namespace pages when displaying large rotation lists.",
      },
      {
        type: "fix",
        title: "Spell Cooldown Calculations",
        description:
          "Corrected cooldown calculation logic for certain abilities that were not accounting for haste properly.",
      },
    ],
  },
  {
    version: "v1.7.0",
    date: "2025-10-05",
    changes: [
      {
        type: "feature",
        title: "User Profile Pages",
        description:
          "Added comprehensive user profile pages showing rotation statistics, achievements, and contribution history.",
      },
      {
        type: "feature",
        title: "Top Gear Recommendations",
        description:
          "New top gear recommendation system that simulates all possible gear combinations to find your optimal setup.",
      },
      {
        type: "improvement",
        title: "Next.js 16 Upgrade",
        description:
          "Upgraded to Next.js 16 with improved server components, better performance, and enhanced developer experience.",
      },
    ],
  },
];

export const changelogEntriesAtom = atom(MOCK_CHANGELOG);

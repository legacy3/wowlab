import type { ResourceProps } from "@refinedev/core";

export const resources: ResourceProps[] = [
  {
    create: "/rotations/new",
    edit: "/rotations/editor",
    list: "/rotations",
    name: "rotations",
    show: "/rotations/:namespace/:slug",
  },
  {
    name: "user_profiles",
    show: "/users/:handle",
  },
  {
    name: "user_settings",
  },
];

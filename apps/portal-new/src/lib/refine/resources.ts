import type { ResourceProps } from "@refinedev/core";

export const resources: ResourceProps[] = [
  {
    name: "rotations",
    list: "/rotations",
    show: "/rotations/:namespace/:slug",
    create: "/rotations/new",
    edit: "/rotations/editor",
  },
  {
    name: "user_profiles",
    show: "/users/:handle",
  },
  {
    name: "user_settings",
  },
];

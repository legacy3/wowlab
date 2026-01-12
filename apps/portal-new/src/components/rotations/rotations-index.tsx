"use client";

import { useUser } from "@/lib/state";

import { RotationBrowser } from "./rotation-browser";

export function RotationsIndex() {
  const { data: user } = useUser();

  return <RotationBrowser userId={user?.id} />;
}

"use client";

import { SignIn } from "@/components/auth/sign-in-content";

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <SignIn />
    </div>
  );
}

"use client";

import { SignIn } from "@/components/auth/sign-in-content";

export default function Unauthorized() {
  return (
    <div className="flex justify-center py-8">
      <SignIn />
    </div>
  );
}

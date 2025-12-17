"use client";

import { useRouter } from "next/navigation";

import { HeaderBackground } from "@/components/page";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border bg-card">
      <HeaderBackground size={900} />

      <div className="relative z-10 flex max-w-xl flex-col items-center gap-5 px-8 py-16 text-center">
        <div className="text-8xl font-extrabold tracking-tighter sm:text-9xl">
          404
        </div>
        <p className="text-lg text-muted-foreground">
          That page doesn’t exist (or it moved).
        </p>

        <Button
          variant="outline"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}

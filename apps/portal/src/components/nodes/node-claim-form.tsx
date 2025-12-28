"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { FlaskButton } from "@/components/ui/flask-loader";
import { useNodeManager } from "@/providers";

export function NodeClaimForm() {
  const router = useRouter();
  const { claimNode } = useNodeManager();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6 || !name.trim()) {
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await claimNode(code.toUpperCase(), name.trim());

    setIsPending(false);

    if (result.success) {
      router.push("/account/nodes");
    } else {
      setError(result.error || "Failed to claim node");
    }
  };

  const isValid = code.length === 6 && name.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => setCode(value.toUpperCase())}
          autoFocus
        >
          <InputOTPGroup>
            <InputOTPSlot
              index={0}
              className="h-12 w-12 text-lg font-mono uppercase"
            />
            <InputOTPSlot
              index={1}
              className="h-12 w-12 text-lg font-mono uppercase"
            />
            <InputOTPSlot
              index={2}
              className="h-12 w-12 text-lg font-mono uppercase"
            />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot
              index={3}
              className="h-12 w-12 text-lg font-mono uppercase"
            />
            <InputOTPSlot
              index={4}
              className="h-12 w-12 text-lg font-mono uppercase"
            />
            <InputOTPSlot
              index={5}
              className="h-12 w-12 text-lg font-mono uppercase"
            />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="space-y-2">
        <Label htmlFor="node-name">Node Name</Label>
        <Input
          id="node-name"
          placeholder="My Gaming PC"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          required
        />
        <p className="text-sm text-muted-foreground">
          A friendly name to identify this node
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <FlaskButton
        type="submit"
        className="w-full"
        disabled={!isValid}
        loading={isPending}
      >
        Claim Node
      </FlaskButton>
    </form>
  );
}

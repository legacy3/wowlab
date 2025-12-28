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
import { Slider } from "@/components/ui/slider";
import { FlaskButton } from "@/components/ui/flask-loader";
import { Button } from "@/components/ui/button";
import { useNodeManager, type PendingNodeInfo } from "@/providers";
import { Check, ArrowLeft, Cpu } from "lucide-react";

type Step = "code" | "configure";

export function NodeClaimForm() {
  const router = useRouter();
  const { validateClaimCode, claimNode } = useNodeManager();

  // Step state
  const [step, setStep] = useState<Step>("code");

  // Code step state
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Configure step state
  const [pendingNode, setPendingNode] = useState<PendingNodeInfo | null>(null);
  const [name, setName] = useState("");
  const [workers, setWorkers] = useState(1);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleValidateCode = async () => {
    if (code.length !== 6) {
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    const result = await validateClaimCode(code.toUpperCase());

    setIsValidating(false);

    if (result.success && result.node) {
      setPendingNode(result.node);
      setName(result.node.proposedName);
      setWorkers(result.node.maxParallel);
      setStep("configure");
    } else {
      setValidationError(result.error || "Invalid claim code");
    }
  };

  const handleBack = () => {
    setStep("code");
    setPendingNode(null);
    setClaimError(null);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsClaiming(true);
    setClaimError(null);

    const result = await claimNode(code.toUpperCase(), name.trim(), workers);

    setIsClaiming(false);

    if (result.success) {
      router.push("/account/nodes");
    } else {
      setClaimError(result.error || "Failed to claim node");
    }
  };

  const isCodeValid = code.length === 6;

  if (step === "code") {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(value) => {
              setCode(value.toUpperCase());
              setValidationError(null);
            }}
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

        {validationError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {validationError}
          </div>
        )}

        <FlaskButton
          type="button"
          className="w-full"
          disabled={!isCodeValid}
          loading={isValidating}
          onClick={handleValidateCode}
        >
          <Check className="mr-2 h-4 w-4" />
          Verify Code
        </FlaskButton>
      </div>
    );
  }

  // Configure step
  return (
    <form onSubmit={handleClaim} className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-1 h-3 w-3" />
          Back
        </Button>
        <span>·</span>
        <span className="font-mono">{code}</span>
        {pendingNode?.version && (
          <>
            <span>·</span>
            <span>v{pendingNode.version}</span>
          </>
        )}
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
          autoFocus
        />
        <p className="text-sm text-muted-foreground">
          A friendly name to identify this node
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Workers
          </Label>
          <span className="text-sm font-medium">
            {workers} / {pendingNode?.maxParallel ?? workers}
          </span>
        </div>
        <Slider
          value={[workers]}
          onValueChange={([value]) => setWorkers(value)}
          min={1}
          max={pendingNode?.maxParallel ?? workers}
          step={1}
        />
        <p className="text-sm text-muted-foreground">
          Number of parallel simulations this node can run
        </p>
      </div>

      {claimError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {claimError}
        </div>
      )}

      <FlaskButton
        type="submit"
        className="w-full"
        disabled={!name.trim()}
        loading={isClaiming}
      >
        Claim Node
      </FlaskButton>
    </form>
  );
}

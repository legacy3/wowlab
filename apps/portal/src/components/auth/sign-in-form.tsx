"use client";

import { useState } from "react";
// TODO(refine-migration): Replace with Refine hooks in Phase 4/5
// import { useSetAtom } from "jotai";
// import { signInWithOAuthAtom } from "@/atoms";
import { useLogin } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthCallbackUrl } from "@/lib/auth-config";
import { Github, MessageCircle, Sparkles } from "lucide-react";

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"discord" | "github" | null>(null);

  // TODO(refine-migration): Now using Refine login
  // const signInWithOAuth = useSetAtom(signInWithOAuthAtom);
  const { mutate: login } = useLogin<{
    provider: "discord" | "github";
    redirectTo: string;
  }>();

  const handleOAuthSignIn = async (provider: "discord" | "github") => {
    setError(null);
    setLoading(provider);

    try {
      login({
        provider,
        redirectTo: getAuthCallbackUrl(),
      });
    } catch {
      setError("An unexpected error occurred");
      setLoading(null);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to Innocent
        </h1>
        <p className="text-sm text-muted-foreground">
          World of Warcraft rotation simulation toolkit
        </p>
      </div>

      <Card className="border-2">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl">Sign in to continue</CardTitle>
          <CardDescription>
            Choose your preferred authentication method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("discord")}
              disabled={loading !== null}
              className="w-full h-11"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Continue with Discord
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading !== null}
              className="w-full h-11"
            >
              <Github className="mr-2 h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Secure authentication
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>

      <p className="px-8 text-center text-sm text-muted-foreground">
        First time here?{" "}
        <span className="font-medium">
          Create an account by signing in with your preferred provider
        </span>
      </p>
    </div>
  );
}

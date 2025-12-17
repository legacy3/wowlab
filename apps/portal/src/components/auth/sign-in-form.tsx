"use client";

import { useState } from "react";
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
import { Link } from "@/components/ui/link";
import { getAuthCallbackUrl } from "@/lib/auth-config";
import { Github, Loader2, MessageCircle } from "lucide-react";

export function SignInForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { mutate: login } = useLogin<{
    provider: "discord" | "github";
    redirectTo: string;
  }>();

  const handleOAuthSignIn = async (provider: "discord" | "github") => {
    setError(null);
    setLoading(true);

    try {
      login({
        provider,
        redirectTo: getAuthCallbackUrl(),
      });
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Signing you in...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
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
              className="w-full h-11"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Continue with Discord
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("github")}
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
            By continuing, you agree to our{" "}
            <Link href="/about?tab=terms-of-service">Terms of Service</Link> and{" "}
            <Link href="/about?tab=privacy-policy">Privacy Policy</Link>
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

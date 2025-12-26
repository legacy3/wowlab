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
import type { OAuthProvider } from "@/lib/refine/auth-provider";
import { CardLoader } from "@/components/ui/flask-loader";
import { DiscordIcon, GitHubIcon, GoogleIcon, TwitchIcon } from "@/lib/icons";

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo }: SignInFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { mutate: login } = useLogin<{
    provider: OAuthProvider;
    redirectTo?: string;
  }>();

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setError(null);
    setLoading(true);

    try {
      login({
        provider,
        redirectTo,
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
          <CardContent className="py-6">
            <CardLoader message="Signing you in ..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="border-2">
        <CardHeader className="space-y-1.5 text-center">
          <CardTitle className="text-2xl">Sign in to continue</CardTitle>
          <CardDescription>
            Choose your preferred authentication method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("discord")}
              className="h-11"
            >
              <DiscordIcon className="mr-2 h-4 w-4" />
              Discord
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("github")}
              className="h-11"
            >
              <GitHubIcon className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("google")}
              className="h-11"
              disabled
            >
              <GoogleIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthSignIn("twitch")}
              className="h-11"
              disabled
            >
              <TwitchIcon className="mr-2 h-4 w-4" />
              Twitch
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

      <p className="text-center text-xs text-muted-foreground/60">
        New here? Signing in creates an account automatically.
      </p>
    </div>
  );
}

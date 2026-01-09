"use client";

import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { CardLoader } from "@/components/ui/flask-loader";
import { DiscordIcon, GitHubIcon, GoogleIcon, TwitchIcon } from "@/lib/icons";
import { Link } from "@/components/ui/link";
import { routes } from "@/lib/routes";
import type { OAuthProvider } from "@/lib/refine/auth-provider";
import styles from "./sign-in.module.scss";

interface SignInProps {
  redirectTo?: string;
}

export function SignIn({ redirectTo }: SignInProps) {
  const [loading, setLoading] = useState(false);
  const { mutate: login } = useLogin<{
    provider: OAuthProvider;
    redirectTo?: string;
  }>();

  const handleOAuthSignIn = (provider: OAuthProvider) => {
    setLoading(true);
    login({ provider, redirectTo });
  };

  if (loading) {
    return (
      <article className={styles.card}>
        <CardLoader message="Signing you in..." />
      </article>
    );
  }

  return (
    <div className={styles.container}>
      <article className={styles.card}>
        <header>
          <h2>Sign in to continue</h2>
          <p className={styles.subtitle}>
            Choose your preferred authentication method
          </p>
        </header>

        <div className={styles.providers}>
          <button
            type="button"
            className="outline"
            onClick={() => handleOAuthSignIn("discord")}
          >
            <DiscordIcon className={styles.icon} />
            Discord
          </button>
          <button
            type="button"
            className="outline"
            onClick={() => handleOAuthSignIn("github")}
          >
            <GitHubIcon className={styles.icon} />
            GitHub
          </button>
          <button type="button" className="outline" disabled>
            <GoogleIcon className={styles.icon} />
            Google
          </button>
          <button type="button" className="outline" disabled>
            <TwitchIcon className={styles.icon} />
            Twitch
          </button>
        </div>

        <hr />

        <footer className={styles.footer}>
          <small>
            By continuing, you agree to our{" "}
            <Link href={routes.about.terms}>Terms</Link> and{" "}
            <Link href={routes.about.privacy}>Privacy Policy</Link>
          </small>
        </footer>
      </article>

      <p className={styles.hint}>
        <small>New here? Signing in creates an account automatically.</small>
      </p>
    </div>
  );
}

import type { ComponentType, SVGProps } from "react";

import type { OAuthProvider } from "@/lib/state";

import { DiscordIcon, GitHubIcon, GoogleIcon, TwitchIcon } from "@/lib/icons";

export interface ProviderMeta {
  enabled: boolean;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  provider: OAuthProvider;
}

export const OAUTH_PROVIDERS: ProviderMeta[] = [
  { enabled: true, icon: DiscordIcon, label: "Discord", provider: "discord" },
  { enabled: true, icon: GitHubIcon, label: "GitHub", provider: "github" },
  { enabled: false, icon: GoogleIcon, label: "Google", provider: "google" },
  { enabled: false, icon: TwitchIcon, label: "Twitch", provider: "twitch" },
];

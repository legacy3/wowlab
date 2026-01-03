import { NextRequest, NextResponse } from "next/server";
import {
  GITHUB_REPO,
  getAssetPattern,
  isValidPlatform,
  isValidVariant,
  type NodePlatform,
  type NodeVariant,
} from "@/lib/config/downloads";

interface GitHubRelease {
  tag_name: string;
  assets: Array<{ name: string; browser_download_url: string }>;
}

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform");
  const variant = request.nextUrl.searchParams.get("variant") ?? "gui";

  if (!platform || !isValidPlatform(platform)) {
    return NextResponse.json(
      { error: "Invalid platform. Use: linux, linux-arm, macos, or windows" },
      { status: 400 },
    );
  }

  if (!isValidVariant(variant)) {
    return NextResponse.json(
      { error: "Invalid variant. Use: gui or headless" },
      { status: 400 },
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "wowlab-portal",
      },
      next: { revalidate: 300 },
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch release info" },
      { status: 502 },
    );
  }

  const release: GitHubRelease = await response.json();
  const pattern = getAssetPattern(variant, platform);
  const asset = release.assets.find((a) => pattern.test(a.name));

  if (!asset) {
    return NextResponse.json(
      {
        error: `No ${variant} ${platform} binary found in ${release.tag_name}`,
      },
      { status: 404 },
    );
  }

  return NextResponse.redirect(asset.browser_download_url);
}

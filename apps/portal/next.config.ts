import type { NextConfig } from "next";

import { withIntlayer } from "next-intlayer/server";

const isDev = process.argv.indexOf("dev") !== -1;
const isBuild = process.argv.indexOf("build") !== -1;

const buildVelite = async () => {
  if (!process.env.VELITE_STARTED && (isDev || isBuild)) {
    process.env.VELITE_STARTED = "1";
    const { build } = await import("velite");
    await build({ clean: !isDev, watch: isDev });
  }
};

buildVelite().catch(console.error);

const NODE_PLATFORMS = ["linux", "linux-arm", "macos", "windows"] as const;

function generateNodeRewrites() {
  return NODE_PLATFORMS.flatMap((platform) => [
    {
      destination: `/api/download/node?platform=${platform}`,
      source: `/go/node-${platform}`,
    },
    {
      destination: `/api/download/node?platform=${platform}&variant=headless`,
      source: `/go/node-headless-${platform}`,
    },
  ]);
}

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },

  async redirects() {
    return [
      {
        destination: "https://discord.gg/bWWYBAvF3W",
        permanent: false,
        source: "/go/discord",
      },
      {
        destination:
          "https://discord.com/oauth2/authorize?client_id=1449784411598880919&permissions=274878024768&integration_type=0&scope=bot+applications.commands",
        permanent: false,
        source: "/go/discord-bot",
      },
      {
        destination: "https://github.com/legacy3/wowlab/:path*",
        permanent: false,
        source: "/go/github/:path*",
      },
      {
        destination: "https://github.com/legacy3/wowlab",
        permanent: false,
        source: "/go/github",
      },
    ];
  },

  async rewrites() {
    return generateNodeRewrites();
  },

  sassOptions: {
    silenceDeprecations: [
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  },
};

export default withIntlayer(nextConfig);

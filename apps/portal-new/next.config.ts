import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    silenceDeprecations: [
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  },
  async redirects() {
    return [
      {
        source: "/go/discord",
        destination: "https://discord.gg/bWWYBAvF3W",
        permanent: false,
      },
      {
        source: "/go/github/:path*",
        destination: "https://github.com/legacy3/wowlab/:path*",
        permanent: false,
      },
      {
        source: "/go/github",
        destination: "https://github.com/legacy3/wowlab",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

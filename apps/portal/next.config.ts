import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const NODE_PLATFORMS = ["linux", "linux-arm", "macos", "windows"] as const;

function generateNodeRewrites() {
  return NODE_PLATFORMS.flatMap((platform) => [
    {
      source: `/go/node-${platform}`,
      destination: `/api/download/node?platform=${platform}`,
    },
    {
      source: `/go/node-headless-${platform}`,
      destination: `/api/download/node?platform=${platform}&variant=headless`,
    },
  ]);
}

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  experimental: {
    authInterrupts: true,
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
  async rewrites() {
    return generateNodeRewrites();
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      "remark-gfm",
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "meta" }],
      "remark-reading-time",
      "remark-reading-time/mdx",
    ],
    rehypePlugins: [
      "rehype-slug",
      "@stefanprobst/rehype-extract-toc",
      "@stefanprobst/rehype-extract-toc/mdx",
    ],
  },
});

export default withMDX(nextConfig);

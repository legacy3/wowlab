import type { NextConfig } from "next";
import createMDX from "@next/mdx";

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

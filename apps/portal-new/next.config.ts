import type { NextConfig } from "next";

import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },

  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  async redirects() {
    return [
      {
        destination: "https://discord.gg/bWWYBAvF3W",
        permanent: false,
        source: "/go/discord",
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

  sassOptions: {
    silenceDeprecations: [
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,

  options: {
    rehypePlugins: [
      "rehype-slug",
      "@stefanprobst/rehype-extract-toc",
      "@stefanprobst/rehype-extract-toc/mdx",
    ],

    remarkPlugins: [
      "remark-gfm",
      "remark-frontmatter",
      ["remark-mdx-frontmatter", { name: "meta" }],
      "remark-reading-time",
      "remark-reading-time/mdx",
    ],
  },
});

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(withMDX(nextConfig));

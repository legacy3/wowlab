import { type Dictionary, t } from "intlayer";

export default {
  content: {
    blogList: {
      noPostsYet: t({
        de: "Noch keine Beiträge",
        en: "No posts yet",
      }),
    },
  },
  description: "Content for blog components.",
  key: "blog",
  tags: ["blog"],
  title: "Blog",
} satisfies Dictionary;

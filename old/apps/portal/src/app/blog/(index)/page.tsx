import { blogIndex, blogTags } from "@/lib/blog";
import { BlogList } from "@/components/blog/blog-list";

export default function BlogPage() {
  return <BlogList posts={blogIndex} tags={blogTags} />;
}

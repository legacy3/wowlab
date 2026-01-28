import { BlogList } from "@/components/blog/blog-list";
import { blogIndex } from "@/lib/content/blog";

export default function BlogPage() {
  return <BlogList posts={blogIndex} />;
}

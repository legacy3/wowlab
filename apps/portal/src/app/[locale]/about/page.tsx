import { AboutTabs } from "@/components/about";
import { aboutPages } from "@/lib/content/about";

export default function AboutPage() {
  return <AboutTabs pages={aboutPages} />;
}

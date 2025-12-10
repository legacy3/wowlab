import Link from "next/link";
import { PageLayout } from "@/components/page";
import { docsIndex } from "@/lib/docs";
import { FileText, ChevronRight } from "lucide-react";

export default function DocsPage() {
  return (
    <PageLayout
      title="Documentation"
      description="Technical documentation for WoW Lab"
      breadcrumbs={[{ label: "Docs", href: "/docs" }]}
    >
      <div className="max-w-2xl">
        <p className="text-muted-foreground mb-8">
          Learn how WoW Lab works under the hood.
        </p>

        {docsIndex.length === 0 ? (
          <p className="text-muted-foreground">No documentation yet.</p>
        ) : (
          <ul className="space-y-1">
            {docsIndex.map((doc) => (
              <li key={doc.slug}>
                <Link
                  href={`/docs/${doc.slug}`}
                  className="group flex items-center gap-2 py-2 px-3 -mx-3 rounded-md hover:bg-muted transition-colors"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{doc.title}</span>
                  {doc.description && (
                    <span className="text-sm text-muted-foreground hidden sm:block">
                      {doc.description}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}

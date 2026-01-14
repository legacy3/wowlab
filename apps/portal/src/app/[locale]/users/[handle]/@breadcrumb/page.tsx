import { PageBreadcrumbs } from "@/components/common";
import { breadcrumb, routes } from "@/lib/routing";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserProfileBreadcrumb({ params }: Props) {
  const { handle } = await params;

  return <PageBreadcrumbs items={breadcrumb(routes.home, `@${handle}`)} />;
}

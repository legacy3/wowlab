import { getExtracted } from "next-intl/server";

import { Empty } from "@/components/ui";

export default async function Page() {
  const t = await getExtracted();

  return (
    <Empty.Root>
      <Empty.Content>
        <Empty.Title>{t("Talents")}</Empty.Title>
        <Empty.Description>
          {t("Talent tree builder coming soon.")}
        </Empty.Description>
      </Empty.Content>
    </Empty.Root>
  );
}

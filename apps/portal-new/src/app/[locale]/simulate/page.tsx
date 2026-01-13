import { getExtracted } from "next-intl/server";

import { Text } from "@/components/ui/text";

export default async function SimulatePage() {
  const t = await getExtracted();

  return <Text>{t("Simulate page content coming soon.")}</Text>;
}

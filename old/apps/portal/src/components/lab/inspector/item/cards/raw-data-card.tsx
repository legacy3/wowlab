"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { useItemData } from "../item-context";

export function RawDataCard() {
  const item = useItemData();

  const sections = [
    { key: "item", label: "Item.csv row", data: item.rawData.item },
    {
      key: "itemSparse",
      label: "ItemSparse.csv row",
      data: item.rawData.itemSparse,
    },
    {
      key: "itemBonus",
      label: `ItemBonus.csv rows (${item.rawData.itemBonus.length})`,
      data: item.rawData.itemBonus,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Raw Data Inspector
        </CardTitle>
        <CardDescription className="text-xs">
          Collapsible sections for raw CSV data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {sections.map((section) => (
            <AccordionItem key={section.key} value={section.key}>
              <AccordionTrigger className="text-sm">
                {section.label}
              </AccordionTrigger>
              <AccordionContent>
                <CodeBlock
                  code={JSON.stringify(section.data, null, 2)}
                  language="json"
                  maxHeight="max-h-64"
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

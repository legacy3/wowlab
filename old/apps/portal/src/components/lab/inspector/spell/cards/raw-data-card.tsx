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
import { useSpellData } from "../spell-context";

export function RawDataCard() {
  const spell = useSpellData();

  const sections = [
    { key: "spell", label: "Spell.csv row", data: spell.rawData.spell },
    {
      key: "spellMisc",
      label: "SpellMisc.csv row",
      data: spell.rawData.spellMisc,
    },
    {
      key: "spellEffect",
      label: `SpellEffect.csv rows (${spell.rawData.spellEffect.length})`,
      data: spell.rawData.spellEffect,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Raw Data Inspector</CardTitle>
        <CardDescription>Collapsible sections for raw CSV data</CardDescription>
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

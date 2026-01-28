"use client";

import { AlertTriangle } from "lucide-react";
import { useIntlayer } from "next-intlayer";
import { Container } from "styled-system/jsx";

import { Button } from "@/components/ui/button";
import * as Empty from "@/components/ui/empty";
import { Link } from "@/components/ui/link";
import { routes } from "@/lib/routing";

export function InvalidLoadoutError() {
  const { errorPage: content } = useIntlayer("traits");

  return (
    <Container maxW="7xl" py="8">
      <Empty.Root>
        <Empty.Icon>
          <AlertTriangle />
        </Empty.Icon>
        <Empty.Content>
          <Empty.Title>{content.invalidLoadoutString}</Empty.Title>
          <Empty.Description>
            {content.invalidLoadoutDescription}
          </Empty.Description>
        </Empty.Content>
        <Empty.Action>
          <Button asChild>
            <Link href={routes.plan.traits.path}>{content.backToStart}</Link>
          </Button>
        </Empty.Action>
      </Empty.Root>
    </Container>
  );
}

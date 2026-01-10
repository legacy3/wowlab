import { styled } from "styled-system/jsx";

import { Card, Heading, Text } from "@/components/ui";

export function ComponentCard({
  children,
  title,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
      </Card.Header>
      <Card.Body>{children}</Card.Body>
    </Card.Root>
  );
}

export function Section({
  children,
  id,
  title,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <styled.section id={id} mb="12" scrollMarginTop="24">
      <Heading
        as="h2"
        size="xl"
        mb="6"
        pb="2"
        borderBottomWidth="1px"
        borderColor="border"
      >
        {title}
      </Heading>
      {children}
    </styled.section>
  );
}

export function Subsection({
  children,
  title,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <styled.div mb="8">
      <Text
        fontWeight="semibold"
        color="fg.muted"
        mb="4"
        textTransform="uppercase"
        letterSpacing="wide"
        textStyle="xs"
      >
        {title}
      </Text>
      {children}
    </styled.div>
  );
}

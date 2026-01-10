import { Grid } from "styled-system/jsx";

import { Button, Card, Text } from "@/components/ui";

import { Section } from "../shared";

export function CardsSection() {
  return (
    <Section id="cards" title="Cards">
      <Grid columns={{ base: 1, md: 2 }} gap="6">
        <Card.Root>
          <Card.Header>
            <Card.Title>Card Title</Card.Title>
            <Card.Description>Card description goes here</Card.Description>
          </Card.Header>
          <Card.Body>
            <Text>Card body content.</Text>
          </Card.Body>
          <Card.Footer>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Save</Button>
          </Card.Footer>
        </Card.Root>

        <Card.Root>
          <Card.Header>
            <Card.Title>Simple Card</Card.Title>
          </Card.Header>
          <Card.Body>
            <Text color="fg.muted">Without description or footer.</Text>
          </Card.Body>
        </Card.Root>
      </Grid>
    </Section>
  );
}

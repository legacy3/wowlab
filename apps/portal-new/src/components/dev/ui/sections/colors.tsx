import { Box, Grid, Stack } from "styled-system/jsx";

import { Badge, Button, Card, Loader, Text } from "@/components/ui";

import { Section } from "../shared";

export function ColorsSection() {
  return (
    <Section id="colors" title="Color Palettes">
      <Text color="fg.muted" mb="6">
        All components support <code>colorPalette</code> prop.
      </Text>
      <Grid columns={{ base: 1, lg: 4, sm: 2 }} gap="6">
        {(["amber", "green", "red", "gray"] as const).map((color) => (
          <Card.Root key={color}>
            <Card.Header>
              <Card.Title textTransform="capitalize">{color}</Card.Title>
            </Card.Header>
            <Card.Body>
              <Stack gap="3">
                <Button colorPalette={color} size="sm">
                  Button
                </Button>
                <Button colorPalette={color} variant="outline" size="sm">
                  Outline
                </Button>
                <Badge colorPalette={color}>Badge</Badge>
                <Box color={`${color}.solid.bg`}>
                  <Loader size="sm" />
                </Box>
              </Stack>
            </Card.Body>
          </Card.Root>
        ))}
      </Grid>
    </Section>
  );
}

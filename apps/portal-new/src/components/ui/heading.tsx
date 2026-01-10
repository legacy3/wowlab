import type { ComponentProps } from "react";
import type { StyledComponent } from "styled-system/types";

import { styled } from "styled-system/jsx";
import { heading, type HeadingVariantProps } from "styled-system/recipes";

export type HeadingProps = ComponentProps<typeof Heading>;

type Props = { as?: React.ElementType } & HeadingVariantProps;
export const Heading = styled("h2", heading) as StyledComponent<"h2", Props>;

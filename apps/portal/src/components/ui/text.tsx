import type { ComponentProps } from "react";
import type { StyledComponent } from "styled-system/types";

import { styled } from "styled-system/jsx";
import { text, type TextVariantProps } from "styled-system/recipes";

export type TextProps = ComponentProps<typeof Text>;

type Props = { as?: React.ElementType } & TextVariantProps;
export const Text = styled("p", text) as StyledComponent<"p", Props>;

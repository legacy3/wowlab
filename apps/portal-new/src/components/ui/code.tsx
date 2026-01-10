import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { styled } from "styled-system/jsx";
import { code } from "styled-system/recipes";

export type CodeProps = ComponentProps<typeof Code>;
export const Code = styled(ark.code, code);

import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { styled } from "styled-system/jsx";
import { errorBox } from "styled-system/recipes";

export type ErrorBoxProps = ComponentProps<typeof ErrorBox>;
export const ErrorBox = styled(ark.div, errorBox);

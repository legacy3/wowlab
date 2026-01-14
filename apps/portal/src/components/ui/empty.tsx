"use client";
import type { ComponentProps } from "react";

import { ark } from "@ark-ui/react/factory";
import { createStyleContext } from "styled-system/jsx";
import { empty } from "styled-system/recipes";

const { withContext, withProvider } = createStyleContext(empty);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(ark.div, "root");
export const Icon = withContext(ark.div, "icon");
export const Content = withContext(ark.div, "content");
export const Title = withContext(ark.p, "title");
export const Description = withContext(ark.p, "description");
export const Action = withContext(ark.div, "action");

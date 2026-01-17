"use client";
import type { ComponentProps } from "react";

import { PinInput, type PinInputRootProps } from "@ark-ui/react/pin-input";
import { createStyleContext } from "styled-system/jsx";
import { pinInput } from "styled-system/recipes";

const { withContext, withProvider } = createStyleContext(pinInput);

const StyledRoot = withProvider(PinInput.Root, "root", {
  forwardProps: ["mask"],
});

export type RootProps = ComponentProps<typeof StyledRoot> &
  Pick<PinInputRootProps, "mask">;
export const Root = StyledRoot as React.ComponentType<RootProps>;

export const RootProvider = withProvider(PinInput.RootProvider, "root");
export const Control = withContext(PinInput.Control, "control");
export const HiddenInput = PinInput.HiddenInput;
export const Input = withContext(PinInput.Input, "input");
export const Label = withContext(PinInput.Label, "label");

export { PinInputContext as Context } from "@ark-ui/react/pin-input";

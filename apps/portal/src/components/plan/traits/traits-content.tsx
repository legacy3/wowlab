"use client";

import { WasmProvider } from "@/providers";

import { InvalidLoadoutError } from "./invalid-loadout-error";
import { TraitCalculator } from "./trait-calculator";
import { TraitStartScreen } from "./trait-start-screen";

interface TraitsCalculatorContentProps {
  specId: number;
  type: "calculator";
}

type TraitsContentProps =
  | TraitsCalculatorContentProps
  | TraitsInvalidContentProps
  | TraitsStartContentProps;

interface TraitsInvalidContentProps {
  type: "invalid";
}

interface TraitsStartContentProps {
  type: "start";
}

export function TraitsContent(props: TraitsContentProps) {
  if (props.type === "invalid") {
    return <InvalidLoadoutError />;
  }

  return (
    <WasmProvider>
      {props.type === "start" ? (
        <TraitStartScreen />
      ) : (
        <TraitCalculator specId={props.specId} />
      )}
    </WasmProvider>
  );
}

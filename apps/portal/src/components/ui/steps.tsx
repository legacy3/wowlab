"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as Tabs from "./tabs";

export interface Step {
  label: string;
  value: string;
}

export interface StepDefinition<T extends string = string> {
  autoAdvanceTo?: () => T | null;
  canUnlock?: () => boolean;
  label: string;
  value: T;
}

interface StepsContext {
  currentIndex: number;
  goBack: () => void;
  goNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  isUnlocked: (value: string) => boolean;
  steps: Step[];
  unlockedIndex: number;
  value: string;
}

const StepsContext = createContext<StepsContext | null>(null);

export interface RootProps {
  children: ReactNode;
  onValueChange?: (value: string) => void;
  steps: Step[];
  unlockedIndex?: number;
  value: string;
  variant?: "line" | "enclosed" | "subtle";
}

export function List() {
  const { isUnlocked, steps } = useSteps();

  return (
    <Tabs.List>
      {steps.map((step, i) => {
        const unlocked = isUnlocked(step.value);
        return (
          <Tabs.Trigger
            key={step.value}
            value={step.value}
            disabled={!unlocked}
            opacity={unlocked ? 1 : 0.5}
            cursor={unlocked ? "pointer" : "not-allowed"}
          >
            <span style={{ marginRight: 8, opacity: 0.6 }}>{i + 1}.</span>
            {step.label}
          </Tabs.Trigger>
        );
      })}
      <Tabs.Indicator />
    </Tabs.List>
  );
}

export function Root({
  children,
  onValueChange,
  steps,
  unlockedIndex = 0,
  value,
  variant = "line",
}: RootProps) {
  const currentIndex = steps.findIndex((s) => s.value === value);

  const isUnlocked = useCallback(
    (stepValue: string) => {
      const idx = steps.findIndex((s) => s.value === stepValue);
      return idx <= unlockedIndex;
    },
    [steps, unlockedIndex],
  );

  const goNext = useCallback(() => {
    if (currentIndex < steps.length - 1 && currentIndex < unlockedIndex) {
      onValueChange?.(steps[currentIndex + 1].value);
    }
  }, [currentIndex, onValueChange, steps, unlockedIndex]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      onValueChange?.(steps[currentIndex - 1].value);
    }
  }, [currentIndex, onValueChange, steps]);

  const ctx = useMemo<StepsContext>(
    () => ({
      currentIndex,
      goBack,
      goNext,
      isFirst: currentIndex === 0,
      isLast: currentIndex === steps.length - 1,
      isUnlocked,
      steps,
      unlockedIndex,
      value,
    }),
    [currentIndex, goBack, goNext, isUnlocked, steps, unlockedIndex, value],
  );

  return (
    <StepsContext.Provider value={ctx}>
      <Tabs.Root
        value={value}
        variant={variant}
        onValueChange={(details) => {
          const targetIndex = steps.findIndex((s) => s.value === details.value);
          if (targetIndex <= unlockedIndex) {
            onValueChange?.(details.value);
          }
        }}
      >
        {children}
      </Tabs.Root>
    </StepsContext.Provider>
  );
}

export function useSteps() {
  const ctx = useContext(StepsContext);
  if (!ctx) {
    throw new Error("useSteps must be used within Steps.Root");
  }
  return ctx;
}

export const Content = Tabs.Content;

export interface UseStepsStateOptions<T extends string = string> {
  initialValue: T;
  onStepChange?: (from: T, to: T) => void;
  steps: StepDefinition<T>[];
}

export interface UseStepsStateReturn<T extends string = string> {
  currentIndex: number;
  goBack: () => void;
  goNext: () => void;
  goTo: (step: T) => void;
  isFirst: boolean;
  isLast: boolean;
  isUnlocked: (step: T) => boolean;
  reset: () => void;
  rootProps: {
    steps: Step[];
    value: T;
    unlockedIndex: number;
    onValueChange: (value: string) => void;
  };
  unlockedIndex: number;
  value: T;
}

export function useStepsState<T extends string = string>({
  initialValue,
  onStepChange,
  steps,
}: UseStepsStateOptions<T>): UseStepsStateReturn<T> {
  const [value, setValue] = useState<T>(initialValue);

  const simpleSteps = useMemo<Step[]>(
    () => steps.map((s) => ({ label: s.label, value: s.value })),
    [steps],
  );

  const unlockedIndex = useMemo(() => {
    let maxUnlocked = 0;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.canUnlock === undefined || step.canUnlock()) {
        maxUnlocked = i;
      } else {
        break;
      }
    }
    return maxUnlocked;
  }, [steps]);

  const currentIndex = useMemo(
    () => steps.findIndex((s) => s.value === value),
    [steps, value],
  );

  const isUnlocked = useCallback(
    (step: T) => {
      const idx = steps.findIndex((s) => s.value === step);
      return idx <= unlockedIndex;
    },
    [steps, unlockedIndex],
  );

  const goTo = useCallback(
    (step: T) => {
      if (isUnlocked(step) && step !== value) {
        onStepChange?.(value, step);
        setValue(step);
      }
    },
    [isUnlocked, onStepChange, value],
  );

  const goNext = useCallback(() => {
    if (currentIndex < steps.length - 1 && currentIndex < unlockedIndex) {
      const nextStep = steps[currentIndex + 1].value;
      onStepChange?.(value, nextStep);
      setValue(nextStep);
    }
  }, [currentIndex, onStepChange, steps, unlockedIndex, value]);

  const goBack = useCallback(() => {
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1].value;
      onStepChange?.(value, prevStep);
      setValue(prevStep);
    }
  }, [currentIndex, onStepChange, steps, value]);

  const reset = useCallback(() => {
    if (value !== initialValue) {
      onStepChange?.(value, initialValue);
      setValue(initialValue);
    }
  }, [initialValue, onStepChange, value]);

  useEffect(() => {
    const currentStep = steps[currentIndex];
    
    if (currentStep?.autoAdvanceTo) {
      const nextValue = currentStep.autoAdvanceTo();

      if (nextValue && isUnlocked(nextValue)) {
        onStepChange?.(value, nextValue);
        setValue(nextValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Auto-advance wizard step
  }, [currentIndex, isUnlocked, onStepChange, steps, value]);

  const rootProps = useMemo(
    () => ({
      onValueChange: (v: string) => goTo(v as T),
      steps: simpleSteps,
      unlockedIndex,
      value,
    }),
    [goTo, simpleSteps, unlockedIndex, value],
  );

  return {
    currentIndex,
    goBack,
    goNext,
    goTo,
    isFirst: currentIndex === 0,
    isLast: currentIndex === steps.length - 1,
    isUnlocked,
    reset,
    rootProps,
    unlockedIndex,
    value,
  };
}

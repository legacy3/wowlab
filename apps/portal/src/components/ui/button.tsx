"use client";
import { ark } from "@ark-ui/react/factory";
import { createContext, mergeProps } from "@ark-ui/react/utils";
import { type ComponentProps, forwardRef, useMemo } from "react";
import { styled } from "styled-system/jsx";
import { button, type ButtonVariantProps } from "styled-system/recipes";

import { AbsoluteCenter } from "./absolute-center";
import { Group, type GroupProps } from "./group";
import { InlineLoader } from "./loader";

type BaseButtonProps = ComponentProps<typeof BaseButton>;

interface ButtonLoadingProps {
  loaderPlacement?: "start" | "end" | undefined;
  loading?: boolean | undefined;
  loadingText?: React.ReactNode | undefined;
}
const BaseButton = styled(ark.button, button);

const Span = styled("span");

export interface ButtonProps extends BaseButtonProps, ButtonLoadingProps {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const propsContext = useButtonPropsContext();
    const buttonProps = useMemo(
      () => mergeProps<ButtonProps>(propsContext, props),
      [propsContext, props],
    );

    const {
      children,
      loaderPlacement = "start",
      loading,
      loadingText,
      ...rest
    } = buttonProps;

    if (!props.asChild && loading) {
      if (loadingText) {
        return (
          <BaseButton
            type="button"
            ref={ref}
            {...rest}
            data-loading=""
            disabled
          >
            {loaderPlacement === "start" && <InlineLoader />}
            {loadingText}
            {loaderPlacement === "end" && <InlineLoader />}
          </BaseButton>
        );
      }

      return (
        <BaseButton type="button" ref={ref} {...rest} data-loading="" disabled>
          <AbsoluteCenter display="inline-flex">
            <InlineLoader />
          </AbsoluteCenter>
          <Span visibility="hidden" display="contents">
            {children}
          </Span>
        </BaseButton>
      );
    }

    return (
      <BaseButton type="button" ref={ref} {...rest} disabled={rest.disabled}>
        {children}
      </BaseButton>
    );
  },
);

export interface ButtonGroupProps extends ButtonVariantProps, GroupProps {}

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  function ButtonGroup(props, ref) {
    const [variantProps, otherProps] = useMemo(
      () => button.splitVariantProps(props),
      [props],
    );

    return (
      <ButtonPropsProvider value={variantProps}>
        <Group ref={ref} {...otherProps} />
      </ButtonPropsProvider>
    );
  },
);

const [ButtonPropsProvider, useButtonPropsContext] =
  createContext<ButtonVariantProps>({
    hookName: "useButtonPropsContext",
    name: "ButtonPropsContext",
    providerName: "<PropsProvider />",
    strict: false,
  });

"use client";
import { Portal } from "@ark-ui/react/portal";
import { Tooltip as ArkTooltip } from "@ark-ui/react/tooltip";
import { type ComponentProps, forwardRef } from "react";
import { createStyleContext } from "styled-system/jsx";
import { tooltip } from "styled-system/recipes";

const { withContext, withRootProvider } = createStyleContext(tooltip);

type ContentProps = ComponentProps<typeof Content>;
type RootProps = ComponentProps<typeof Root>;
const Root = withRootProvider(ArkTooltip.Root, {
  defaultProps: { lazyMount: true, unmountOnExit: true },
});
const Arrow = withContext(ArkTooltip.Arrow, "arrow");
const ArrowTip = withContext(ArkTooltip.ArrowTip, "arrowTip");
const Content = withContext(ArkTooltip.Content, "content");
const Positioner = withContext(ArkTooltip.Positioner, "positioner");
const Trigger = withContext(ArkTooltip.Trigger, "trigger");

export { TooltipContext as Context } from "@ark-ui/react/tooltip";

export interface TooltipProps extends Omit<RootProps, "content"> {
  children: React.ReactNode | undefined;
  content: React.ReactNode | string;
  contentProps?: ContentProps;
  disabled?: boolean;
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement | null>;
  showArrow?: boolean;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, ref) {
    const {
      children,
      content,
      contentProps,
      disabled,
      portalled = true,
      portalRef,
      showArrow,
      ...rootProps
    } = props;

    if (disabled) {
      return children;
    }

    return (
      <Root {...rootProps}>
        <Trigger asChild>{children}</Trigger>
        <Portal disabled={!portalled} container={portalRef}>
          <Positioner>
            <Content ref={ref} {...contentProps}>
              {showArrow && (
                <Arrow>
                  <ArrowTip />
                </Arrow>
              )}
              {content}
            </Content>
          </Positioner>
        </Portal>
      </Root>
    );
  },
);

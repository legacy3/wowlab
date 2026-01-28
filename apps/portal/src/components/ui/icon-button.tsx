import { forwardRef } from "react";

import { Button, type ButtonProps } from "./button";

export type IconButtonProps = ButtonProps;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    return <Button px="0" py="0" ref={ref} {...props} />;
  },
);

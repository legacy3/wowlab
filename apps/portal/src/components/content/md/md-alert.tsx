import type { ReactNode } from "react";

import * as Alert from "@/components/ui/alert";

type MdAlertProps = {
  children: ReactNode;
  title?: string;
};

export function MdAlert({ children, title }: MdAlertProps) {
  return (
    <Alert.Root>
      <Alert.Indicator />
      <Alert.Content>
        {title && <Alert.Title>{title}</Alert.Title>}
        <Alert.Description>{children}</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}

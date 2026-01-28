"use client";

import type { ReactNode } from "react";

import {
  EditIcon,
  type LucideIcon,
  MoreVerticalIcon,
  TrashIcon,
} from "lucide-react";
import { useIntlayer } from "next-intlayer";

import { IconButton, Menu } from "../../ui";

export interface EditDeleteMenuProps {
  ariaLabel?: string;
  canDelete?: boolean;
  onDelete: () => void;
  onEdit: () => void;
}

export interface ItemActionsMenuProps {
  actions: MenuAction[];
  ariaLabel?: string;
  size?: "xs" | "sm" | "md";
  trigger?: ReactNode;
}

export interface MenuAction {
  destructive?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  value: string;
}

export function EditDeleteMenu({
  ariaLabel,
  canDelete = true,
  onDelete,
  onEdit,
}: EditDeleteMenuProps) {
  const { itemActionsMenu: content } = useIntlayer("editor");

  return (
    <ItemActionsMenu
      ariaLabel={ariaLabel ?? content.itemActions}
      actions={[
        { icon: EditIcon, label: content.edit, onClick: onEdit, value: "edit" },
        {
          destructive: true,
          disabled: !canDelete,
          icon: TrashIcon,
          label: content.delete,
          onClick: onDelete,
          value: "delete",
        },
      ]}
    />
  );
}

export function ItemActionsMenu({
  actions,
  ariaLabel,
  size = "xs",
  trigger,
}: ItemActionsMenuProps) {
  const { itemActionsMenu: content } = useIntlayer("editor");
  const regularActions = actions.filter((a) => !a.destructive);
  const destructiveActions = actions.filter((a) => a.destructive);
  const resolvedAriaLabel = ariaLabel ?? content.actions;

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        {trigger ?? (
          <IconButton
            variant="plain"
            size={size}
            aria-label={resolvedAriaLabel}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVerticalIcon size={14} />
          </IconButton>
        )}
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          {regularActions.map((action) => (
            <Menu.Item
              key={action.value}
              value={action.value}
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              <action.icon size={14} />
              <Menu.ItemText>{action.label}</Menu.ItemText>
            </Menu.Item>
          ))}
          {regularActions.length > 0 && destructiveActions.length > 0 && (
            <Menu.Separator />
          )}
          {destructiveActions.map((action) => (
            <Menu.Item
              key={action.value}
              value={action.value}
              disabled={action.disabled}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              <action.icon size={14} />
              <Menu.ItemText>{action.label}</Menu.ItemText>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}

import type { ReactNode } from "react";

import { styled } from "styled-system/jsx";

type MdListProps = {
  children: ReactNode;
};

const Li = styled("li");
const Ol = styled("ol");
const Ul = styled("ul");

export function MdLi({ children }: MdListProps) {
  return <Li>{children}</Li>;
}

export function MdOl({ children }: MdListProps) {
  return <Ol>{children}</Ol>;
}

export function MdUl({ children }: MdListProps) {
  return <Ul>{children}</Ul>;
}

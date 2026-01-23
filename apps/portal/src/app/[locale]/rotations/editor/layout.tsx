import type { ReactNode } from "react";

import { unauthorized } from "next/navigation";
import { Container } from "styled-system/jsx";

import { createClient } from "@/lib/supabase/server";

export default async function EditorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    unauthorized();
  }

  return (
    <Container maxW="8xl" py="6">
      {children}
    </Container>
  );
}

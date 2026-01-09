"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useGetIdentity, useLogout } from "@refinedev/core";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import * as Menu from "@/components/ui/menu";
import { routes } from "@/lib/routes";
import type { UserIdentity } from "@/lib/supabase";
import styles from "./index.module.scss";

function AuthButtonInner() {
  const router = useRouter();
  const { data: user } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();

  if (user) {
    return (
      <Menu.Root>
        <Menu.Trigger className={styles.trigger}>
          {user.handle || user.email || "Account"}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end">
            <Menu.Popup className={styles.popup}>
              <Menu.Item className={styles.item} onClick={() => logout()}>
                Sign Out
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }

  return (
    <button onClick={() => router.push(routes.auth.signIn)}>Sign In</button>
  );
}

export function AuthButton() {
  return (
    <Suspense fallback={<FlaskInlineLoader />}>
      <AuthButtonInner />
    </Suspense>
  );
}

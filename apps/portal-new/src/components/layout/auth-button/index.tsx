"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { useGetIdentity, useLogout } from "@refinedev/core";
import * as Avatar from "@/components/ui/avatar";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import * as Menu from "@/components/ui/menu";
import { formatHandleInitials } from "@/lib/format";
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
          <Avatar.Root className={styles.avatar}>
            {user.avatarUrl && <Avatar.Image src={user.avatarUrl} alt="" />}
            <Avatar.Fallback>
              {formatHandleInitials(user.handle)}
            </Avatar.Fallback>
          </Avatar.Root>
          {user.handle && <span className={styles.name}>{user.handle}</span>}
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

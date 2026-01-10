"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";

import * as Avatar from "@/components/ui/avatar";
import { FlaskInlineLoader } from "@/components/ui/flask-loader";
import * as Menu from "@/components/ui/menu";
import { routes } from "@/lib/routes";
import { useUser } from "@/lib/state";

import styles from "./index.module.scss";

export function AuthButton() {
  return (
    <Suspense fallback={<FlaskInlineLoader />}>
      <AuthButtonInner />
    </Suspense>
  );
}

function AuthButtonInner() {
  const router = useRouter();
  const { data, logout } = useUser();

  if (data) {
    return (
      <Menu.Root>
        <Menu.Trigger className={styles.trigger}>
          <Avatar.Root className={styles.avatar}>
            {data.avatarUrl && <Avatar.Image src={data.avatarUrl} alt="" />}
            <Avatar.Fallback>{data.initials}</Avatar.Fallback>
          </Avatar.Root>
          {data.handle && <span className={styles.name}>{data.handle}</span>}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end">
            <Menu.Popup className={styles.popup}>
              <Menu.Item className={styles.item} onClick={logout}>
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

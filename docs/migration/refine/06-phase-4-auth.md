# Phase 4: Migrate Auth to Refine

## Prompt for Claude

```
I'm migrating to Refine. Phase 3 (deletion) is complete.

**YOUR TASK**: Migrate all auth-related components and pages to use Refine's auth hooks.

## Refine Auth Hooks Reference

| Old Pattern                      | New Pattern                |
| -------------------------------- | -------------------------- |
| `useAtom(sessionAtom)`           | `useIsAuthenticated()`     |
| `useAtom(currentUserAtom)`       | `useGetIdentity()`         |
| `supabase.auth.signInWithOAuth`  | `useLogin()`               |
| `supabase.auth.signOut`          | `useLogout()`              |
| `requireAuth()` server function  | `useIsAuthenticated()` + redirect |

## Step 1: Find All Auth Usages

Search for these patterns in the codebase:

grep -rn "sessionAtom\|currentUserAtom\|useAtom.*auth\|signInWithOAuth\|signOut\|getSession\|getUser" apps/portal/src/ --include="*.tsx" --include="*.ts"

Common files to check:
- apps/portal/src/components/auth/login-button.tsx
- apps/portal/src/components/auth/user-menu.tsx
- apps/portal/src/components/layout/header.tsx
- apps/portal/src/app/account/page.tsx
- apps/portal/src/app/rotations/new/page.tsx
- apps/portal/src/app/rotations/editor/page.tsx

## Step 2: Update Sign-In Button

Before:
import { useAtomValue } from "jotai";
import { supabaseClientAtom } from "@/atoms/supabase";

const supabase = useAtomValue(supabaseClientAtom);
const handleLogin = async (provider: "discord" | "github") => {
  await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
};

After:
import { useLogin } from "@refinedev/core";

const { mutate: login, isLoading } = useLogin();
const handleLogin = (provider: "discord" | "github") => {
  login({ provider });
};

## Step 3: Update Sign-Out Button

Before:
const supabase = useAtomValue(supabaseClientAtom);
const handleLogout = async () => {
  await supabase.auth.signOut();
};

After:
import { useLogout } from "@refinedev/core";

const { mutate: logout, isLoading } = useLogout();
const handleLogout = () => {
  logout();
};

## Step 4: Update Auth Checks (Protected Pages)

Before:
import { useAtomValue } from "jotai";
import { sessionAtom } from "@/atoms/supabase";
import { redirect } from "next/navigation";

const session = useAtomValue(sessionAtom);
if (!session) redirect("/");

After:
import { useIsAuthenticated } from "@refinedev/core";
import { redirect } from "next/navigation";

const { data: auth, isLoading } = useIsAuthenticated();

if (isLoading) return <PageSkeleton />;
if (!auth?.authenticated) redirect("/");

## Step 5: Update User Identity Access

Before:
import { useAtomValue } from "jotai";
import { currentUserAtom, profileAtom } from "@/atoms/supabase";

const user = useAtomValue(currentUserAtom);
const profile = useAtomValue(profileAtom);
const displayName = profile?.handle ?? user?.email;

After:
import { useGetIdentity } from "@refinedev/core";

interface UserIdentity {
  id: string;
  email?: string;
  handle?: string;
  avatarUrl?: string;
}

const { data: identity, isLoading } = useGetIdentity<UserIdentity>();
const displayName = identity?.handle ?? identity?.email;

## Step 6: Update Account Page

apps/portal/src/app/account/page.tsx:

"use client";

import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account/account-settings";
import { AccountSkeleton } from "@/components/account/account-skeleton";

interface UserIdentity {
  id: string;
  email?: string;
  handle?: string;
  avatarUrl?: string;
}

export default function AccountPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } = useGetIdentity<UserIdentity>();

  if (authLoading || identityLoading) {
    return <AccountSkeleton />;
  }

  if (!auth?.authenticated) {
    redirect("/");
  }

  return <AccountSettings identity={identity} />;
}

## Step 7: Update User Menu Component

apps/portal/src/components/layout/user-menu.tsx (or similar):

"use client";

import { useGetIdentity, useLogout, useIsAuthenticated } from "@refinedev/core";

interface UserIdentity {
  id: string;
  email?: string;
  handle?: string;
  avatarUrl?: string;
}

export function UserMenu() {
  const { data: auth } = useIsAuthenticated();
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { mutate: logout } = useLogout();

  if (!auth?.authenticated) {
    return <LoginButton />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar src={identity?.avatarUrl} />
        <span>{identity?.handle ?? identity?.email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => logout()}>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

## Step 8: OAuth Callback Route

The OAuth callback route (apps/portal/src/app/auth/callback/route.ts) handles the server-side token exchange. This should NOT change - it uses the Supabase server client directly.

Verify it still works by testing the login flow.

## Verify

1. Run pnpm build
2. Test login flow in browser:
   - Click login button
   - Complete OAuth with Discord/GitHub
   - Verify redirect back to app
   - Verify user menu shows identity
3. Test logout flow:
   - Click logout
   - Verify redirect to home
   - Verify user menu shows login button
4. Test protected pages:
   - Try accessing /account while logged out
   - Verify redirect to home
   - Login and verify /account is accessible
```

## Expected Outcome

- All auth uses Refine hooks
- Login/logout flows work
- Protected pages check auth correctly
- User identity accessible via useGetIdentity

## Checklist

- [ ] Find all files using old auth patterns
- [ ] Update sign-in button to use useLogin
- [ ] Update sign-out button to use useLogout
- [ ] Update auth checks to use useIsAuthenticated
- [ ] Update user identity access to use useGetIdentity
- [ ] Update account page
- [ ] Update user menu component
- [ ] Verify OAuth callback still works
- [ ] Run pnpm build
- [ ] Test login flow manually
- [ ] Test logout flow manually
- [ ] Test protected page redirect

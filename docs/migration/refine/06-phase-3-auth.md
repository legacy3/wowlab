# Phase 3: Migrate Auth to Refine

## Prompt for Claude

```
I'm migrating to Refine. Phase 2 (providers) is complete.

**YOUR TASK**: Migrate all auth-related components and pages to use Refine's auth hooks.

## Refine Auth Hooks

Replace old patterns with these Refine hooks:

| Old Pattern | New Pattern |
|-------------|-------------|
| `useAtom(sessionAtom)` | `useIsAuthenticated()` |
| `useAtom(currentUserAtom)` | `useGetIdentity()` |
| `supabase.auth.signInWithOAuth` | `useLogin()` |
| `supabase.auth.signOut` | `useLogout()` |
| `requireAuth()` server function | `useIsAuthenticated()` + redirect |

## Step 1: Find All Auth Usages

Search for these patterns in the codebase:
- `sessionAtom`
- `currentUserAtom`
- `useAtom.*auth`
- `requireAuth`
- `getAuth`
- `signInWithOAuth`
- `signOut`

## Step 2: Update Sign-In Page/Button

Before:
const supabase = useAtomValue(supabaseClientAtom);
const handleLogin = async () => {
  await supabase.auth.signInWithOAuth({ provider: "discord" });
};

After:
const { mutate: login } = useLogin();
const handleLogin = () => {
  login({ provider: "discord" });
};

## Step 3: Update Sign-Out Button

Before:
const supabase = useAtomValue(supabaseClientAtom);
const handleLogout = async () => {
  await supabase.auth.signOut();
};

After:
const { mutate: logout } = useLogout();
const handleLogout = () => {
  logout();
};

## Step 4: Update Auth Checks

Before:
const session = useAtomValue(sessionAtom);
if (!session) redirect("/");

After:
const { data: auth, isLoading } = useIsAuthenticated();
if (isLoading) return <Skeleton />;
if (!auth?.authenticated) redirect("/");

## Step 5: Update User Identity Access

Before:
const user = useAtomValue(currentUserAtom);
const profile = useAtomValue(profileAtom);

After:
const { data: identity, isLoading } = useGetIdentity<{
  id: string;
  email: string;
  handle: string;
  avatar_url: string;
}>();

## Step 6: Update Account Page

The account page should use useGetIdentity for the current user's data:

"use client";

import { useGetIdentity, useIsAuthenticated } from "@refinedev/core";
import { redirect } from "next/navigation";

export default function AccountPage() {
  const { data: auth, isLoading: authLoading } = useIsAuthenticated();
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  if (authLoading || identityLoading) return <AccountSkeleton />;
  if (!auth?.authenticated) redirect("/");

  return <AccountSettings identity={identity} />;
}

## Step 7: OAuth Callback Route

The OAuth callback route (apps/portal/src/app/auth/callback/route.ts) should remain mostly the same since it handles the server-side token exchange. Just verify it still works.

## Verify

1. Run pnpm build
2. Test login flow in browser
3. Test logout flow
4. Test protected pages redirect
5. Verify user identity is available where needed
```

## Expected Outcome

- All auth uses Refine hooks
- Login/logout flows work
- Protected pages check auth correctly
- User identity accessible via useGetIdentity

## Checklist

- [ ] Find all files using old auth patterns
- [ ] Update sign-in button/page to use useLogin
- [ ] Update sign-out button to use useLogout
- [ ] Update auth checks to use useIsAuthenticated
- [ ] Update user identity access to use useGetIdentity
- [ ] Update account page
- [ ] Verify OAuth callback still works
- [ ] Run pnpm build
- [ ] Test login flow manually
- [ ] Test logout flow manually
- [ ] Test protected page redirect

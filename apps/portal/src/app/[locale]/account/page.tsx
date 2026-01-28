import { redirect } from "next/navigation";

import { routes } from "@/lib/routing";

// TODO : Implement account overview page
export default function AccountRoute() {
  redirect(routes.account.nodes.index.path);
}

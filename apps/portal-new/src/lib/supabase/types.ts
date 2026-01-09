import type { Row } from "./helpers";

export interface UserIdentity extends Pick<
  Row<"user_profiles">,
  "id" | "avatarUrl"
> {
  email?: string;
  handle?: string;
}

import { type Dictionary, enu, insert, t } from "intlayer";

export default {
  content: {
    userProfilePage: {
      avatarAlt: insert(
        t({
          de: "Avatar von {{handle}}",
          en: "{{handle}}'s avatar",
        }),
      ),
      handleDoesNotExist: insert(
        t({
          de: "@{{handle}} existiert nicht",
          en: "@{{handle}} does not exist",
        }),
      ),
      noPublicRotations: t({
        de: "Keine öffentlichen Rotations",
        en: "No public rotations",
      }),
      noRotationsYet: insert(
        t({
          de: "@{{handle}} hat noch keine Rotations veröffentlicht.",
          en: "@{{handle}} has not published any rotations yet.",
        }),
      ),
      publicRotations: t({
        de: "Öffentliche Rotations",
        en: "Public Rotations",
      }),
      rotationCount: enu({
        "1": t({ de: "Rotation", en: "rotation" }),
        fallback: t({ de: "Rotations", en: "rotations" }),
      }),
      userNotFound: t({
        de: "Benutzer nicht gefunden",
        en: "User not found",
      }),
    },
  },
  description: "Content for user profile page.",
  key: "users",
  tags: ["users", "profile"],
  title: "Users",
} satisfies Dictionary;

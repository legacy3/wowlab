import { type Dictionary, t } from "intlayer";

export default {
  content: {
    rotationBrowser: {
      actions: t({ de: "Aktionen", en: "Actions" }),
      all: t({ de: "Alle", en: "All" }),
      allClasses: t({
        de: "Alle Klassen",
        en: "All Classes",
      }),
      clearClassFilter: t({
        de: "Klassenfilter löschen",
        en: "Clear class filter",
      }),
      clearSearch: t({
        de: "Suche löschen",
        en: "Clear search",
      }),
      confirmDelete: t({
        de: "Bist du sicher, dass du diese Rotation löschen möchtest?",
        en: "Are you sure you want to delete this rotation?",
      }),
      createRotation: t({
        de: "Rotation erstellen",
        en: "Create rotation",
      }),
      delete: t({ de: "Löschen", en: "Delete" }),
      edit: t({ de: "Bearbeiten", en: "Edit" }),
      mine: t({ de: "Meine", en: "Mine" }),
      name: t({ de: "Name", en: "Name" }),
      new: t({ de: "Neu", en: "New" }),
      noRotationsFound: t({
        de: "Keine Rotations gefunden",
        en: "No rotations found",
      }),
      noRotationsYet: t({
        de: "Du hast noch keine Rotations erstellt",
        en: "You haven't created any rotations yet",
      }),
      private: t({ de: "Privat", en: "Private" }),
      public: t({ de: "Öffentlich", en: "Public" }),
      searchPlaceholder: t({
        de: "Suchen...",
        en: "Search...",
      }),
      spec: t({ de: "Spec", en: "Spec" }),
      updated: t({ de: "Aktualisiert", en: "Updated" }),
      visibility: t({ de: "Sichtbarkeit", en: "Visibility" }),
    },
  },
  description: "Content for rotation browser.",
  key: "rotations",
  tags: ["rotations"],
  title: "Rotations",
} satisfies Dictionary;

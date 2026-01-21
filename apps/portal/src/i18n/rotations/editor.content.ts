import { type Dictionary, t } from "intlayer";

export default {
  content: {
    actionCard: {
      callActionList: t({
        de: "Call Action List",
        en: "Call action list",
      }),
      conditions: t({ de: "Bedingungen", en: "Conditions" }),
      delete: t({ de: "Löschen", en: "Delete" }),
      disable: t({ de: "Deaktivieren", en: "Disable" }),
      disableAction: t({ de: "Aktion deaktivieren", en: "Disable action" }),
      duplicate: t({ de: "Duplizieren", en: "Duplicate" }),
      enable: t({ de: "Aktivieren", en: "Enable" }),
      enableAction: t({ de: "Aktion aktivieren", en: "Enable action" }),
      item: t({ de: "Gegenstand", en: "Item" }),
      noOtherLists: t({ de: "Keine anderen Listen", en: "No other lists" }),
      selectItem: t({ de: "Gegenstand auswählen...", en: "Select item..." }),
      selectList: t({ de: "Liste auswählen...", en: "Select list..." }),
      selectSpell: t({ de: "Zauber auswählen...", en: "Select spell..." }),
      spell: t({ de: "Zauber", en: "Spell" }),
      targetList: t({ de: "Zielliste", en: "Target List" }),
      type: t({ de: "Typ", en: "Type" }),
    },
    actionList: {
      addAction: t({ de: "Aktion hinzufügen", en: "Add action" }),
      addSpellsItemsOrCallOther: t({
        de: "Füge Zauber, Gegenstände hinzu oder rufe andere Action Lists auf, um deine Rotation zu erstellen.",
        en: "Add spells, items, or call other action lists to build your rotation.",
      }),
      entryPoint: t({ de: "Entry Point", en: "Entry Point" }),
      noActionsYet: t({ de: "Noch keine Aktionen", en: "No actions yet" }),
      precombat: t({ de: "Precombat", en: "Precombat" }),
      selectListFromSidebar: t({
        de: "Wähle eine Liste aus der Seitenleiste",
        en: "Select a list from the sidebar",
      }),
    },
    actionPicker: {
      addAction: t({ de: "Aktion hinzufügen", en: "Add action" }),
      cancel: t({ de: "Abbrechen", en: "Cancel" }),
      noOtherActionListsAvailable: t({
        de: "Keine anderen Action Lists verfügbar. Erstelle zuerst eine neue.",
        en: "No other action lists available. Create a new list first.",
      }),
      searchItemDescription: t({
        de: "Suche nach einem Gegenstand für die Rotation.",
        en: "Search for an item to use in the rotation.",
      }),
      searchSpellDescription: t({
        de: "Suche nach einem Zauber für die Rotation.",
        en: "Search for a spell to add to the rotation.",
      }),
      selectActionListDescription: t({
        de: "Wähle eine Action List aus.",
        en: "Select an action list to call.",
      }),
      selectAList: t({ de: "Liste auswählen...", en: "Select a list..." }),
    },
    collapsedSidebar: {
      expandSidebar: t({
        de: "Seitenleiste einblenden",
        en: "Expand sidebar",
      }),
    },
    conditionControls: {
      combinatorPlaceholder: t({ de: "...", en: "..." }),
      group: t({ de: "Gruppe", en: "Group" }),
      noFieldsFound: t({ de: "Keine Felder gefunden", en: "No fields found" }),
      operatorPlaceholder: t({ de: "Operator...", en: "Operator..." }),
      remove: t({ de: "Entfernen", en: "Remove" }),
      rule: t({ de: "Regel", en: "Rule" }),
      searchFields: t({ de: "Felder suchen...", en: "Search fields..." }),
      selectValue: t({ de: "Wert auswählen...", en: "Select value..." }),
      valuePlaceholder: t({ de: "Wert...", en: "Value..." }),
    },
    gameObjectPicker: {
      loading: t({ de: "Wird geladen...", en: "Loading..." }),
      search: t({ de: "Suchen...", en: "Search..." }),
      typeAtLeastNCharacters: t({
        de: "Mindestens 2 Zeichen eingeben",
        en: "Type at least 2 characters",
      }),
    },
    header: {
      create: t({ de: "Erstellen", en: "Create" }),
      createRotation: t({ de: "Rotation erstellen", en: "Create rotation" }),
      edit: t({ de: "Bearbeiten", en: "Edit" }),
      editMode: t({ de: "Bearbeitungsmodus", en: "Edit mode" }),
      lock: t({ de: "Sperren", en: "Lock" }),
      locked: t({ de: "Gesperrt", en: "Locked" }),
      lockRotation: t({ de: "Rotation sperren", en: "Lock rotation" }),
      new: t({ de: "Neu", en: "New" }),
      preview: t({ de: "Vorschau", en: "Preview" }),
      previewMode: t({ de: "Vorschaumodus", en: "Preview mode" }),
      public: t({ de: "Öffentlich", en: "Public" }),
      readOnly: t({ de: "Nur lesen", en: "Read-only" }),
      rotationNamePlaceholder: t({
        de: "Rotationsname...",
        en: "Rotation name...",
      }),
      save: t({ de: "Speichern", en: "Save" }),
      saveChanges: t({ de: "Änderungen speichern", en: "Save changes" }),
      unlock: t({ de: "Entsperren", en: "Unlock" }),
      unlockToEdit: t({
        de: "Zum Bearbeiten entsperren",
        en: "Unlock to edit",
      }),
      unsaved: t({ de: "Ungespeichert", en: "Unsaved" }),
      untitledRotation: t({
        de: "Unbenannte Rotation",
        en: "Untitled Rotation",
      }),
    },
    itemActionsMenu: {
      actions: t({ de: "Aktionen", en: "Actions" }),
      delete: t({ de: "Löschen", en: "Delete" }),
      edit: t({ de: "Bearbeiten", en: "Edit" }),
      itemActions: t({ de: "Elementaktionen", en: "Item actions" }),
    },
    page: {
      failedToLoadRotation: t({
        de: "Rotation konnte nicht geladen werden:",
        en: "Failed to load rotation:",
      }),
      rotationNotFound: t({
        de: "Rotation nicht gefunden",
        en: "Rotation not found",
      }),
      unknownError: t({
        de: "Unbekannter Fehler",
        en: "Unknown error",
      }),
    },
    preview: {
      copied: t({ de: "Kopiert!", en: "Copied!" }),
      copiedShort: t({ de: "Kopiert", en: "Copied" }),
      copy: t({ de: "Kopieren", en: "Copy" }),
      copyAsDsl: t({ de: "Als DSL kopieren", en: "Copy as DSL" }),
      useTheDslOrNaturalTabs: t({
        de: "Verwende die DSL- oder Natürlich-Tabs, um deine Rotation anzuzeigen.",
        en: "Use the DSL or Natural tabs to preview your rotation.",
      }),
      visualPreviewComingSoon: t({
        de: "Visuelle Vorschau demnächst verfügbar",
        en: "Visual preview coming soon",
      }),
    },
    selectField: {
      noOptionsAvailable: t({
        de: "Keine Optionen verfügbar",
        en: "No options available",
      }),
      select: t({ de: "Auswählen...", en: "Select..." }),
    },
    sidebar: {
      actionLists: t({ de: "Action Lists", en: "Action Lists" }),
      addList: t({ de: "Liste hinzufügen", en: "Add list" }),
      addVariable: t({ de: "Variable hinzufügen", en: "Add variable" }),
      addYourFirstList: t({
        de: "Füge deine erste Liste hinzu",
        en: "Add your first list",
      }),
      addYourFirstVariable: t({
        de: "Füge deine erste Variable hinzu",
        en: "Add your first variable",
      }),
      lists: t({ de: "Listen", en: "Lists" }),
      noListsYet: t({ de: "Noch keine Listen", en: "No lists yet" }),
      noVariablesYet: t({ de: "Noch keine Variablen", en: "No variables yet" }),
      useCodeInConditions: t({
        de: "$name in Bedingungen verwenden",
        en: "Use $name in conditions",
      }),
      variables: t({ de: "Variablen", en: "Variables" }),
      vars: t({ de: "Vars", en: "Vars" }),
    },
    sortableListItem: {
      defaultList: t({ de: "Standardliste", en: "Default list" }),
      delete: t({ de: "Löschen", en: "Delete" }),
      listActions: t({ de: "Listenaktionen", en: "List actions" }),
      main: t({ de: "Main", en: "Main" }),
      pre: t({ de: "Pre", en: "Pre" }),
      rename: t({ de: "Umbenennen", en: "Rename" }),
      setAsDefault: t({ de: "Als Standard setzen", en: "Set as default" }),
    },
    variableEditorDialog: {
      add: t({ de: "Hinzufügen", en: "Add" }),
      addVariable: t({ de: "Variable hinzufügen", en: "Add Variable" }),
      cancel: t({ de: "Abbrechen", en: "Cancel" }),
      editVariable: t({ de: "Variable bearbeiten", en: "Edit Variable" }),
      expression: t({ de: "Ausdruck", en: "Expression" }),
      expressionEvaluatedAtRuntime: t({
        de: "Ausdruck wird zur Laufzeit ausgewertet.",
        en: "Expression evaluated at runtime.",
      }),
      expressionPlaceholder: t({
        de: "target.health.pct < 20",
        en: "target.health.pct < 20",
      }),
      name: t({ de: "Name", en: "Name" }),
      save: t({ de: "Speichern", en: "Save" }),
      useSnakeCaseHint: t({
        de: "Verwende snake_case. Wird als $name in Bedingungen referenziert.",
        en: "Use snake_case. Referenced as $name in conditions.",
      }),
      variableNamePlaceholder: t({
        de: "variablen_name",
        en: "variable_name",
      }),
    },
  },
  description: "Content for rotation editor.",
  key: "editor",
  tags: ["editor", "rotation"],
  title: "Editor",
} satisfies Dictionary;

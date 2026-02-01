import { type Dictionary, insert, t } from "intlayer";

export default {
  content: {
    bulkActionBar: {
      clearSelection: t({ de: "Auswahl aufheben", en: "Clear selection" }),
      powerOff: t({ de: "Ausschalten", en: "Power Off" }),
      powerOn: t({ de: "Einschalten", en: "Power On" }),
      selected: insert(
        t({ de: "{{count}} ausgewählt", en: "{{count}} selected" }),
      ),
    },
    discordLink: {
      bannerText: t({
        de: "Discord ist nicht verknüpft. Du kannst keine Guild-geschützten Nodes nutzen.",
        en: "Discord is not linked. You won't be able to use guild-gated nodes.",
      }),
      linkButton: t({ de: "Discord verknüpfen", en: "Link Discord" }),
    },
    downloadDialog: {
      description: t({
        de: "Führe lokale Simulationen aus oder teile Rechenleistung mit anderen",
        en: "Run local simulations or share compute with others",
      }),
      desktop: t({ de: "Desktop", en: "Desktop" }),
      detected: t({ de: "Erkannt", en: "Detected" }),
      downloadCliHeadless: t({
        de: "CLI herunterladen (headless)",
        en: "Download CLI (headless)",
      }),
      getTheNode: t({ de: "Node herunterladen", en: "Get the Node" }),
      multiArchContainer: t({
        de: "Multi-Arch-Container für Server",
        en: "Multi-arch container for servers",
      }),
      view: t({ de: "Ansehen", en: "View" }),
    },
    nodesPage: {
      addNode: t({ de: "Node hinzufügen", en: "Add Node" }),
      addYourFirstNode: t({
        de: "Füge deinen ersten Node hinzu",
        en: "Add Your First Node",
      }),
      nodes: t({ de: "Nodes", en: "Nodes" }),
      noNodesYet: t({ de: "Noch keine Nodes", en: "No nodes yet" }),
      online: t({ de: "Online", en: "Online" }),
      workers: t({ de: "Workers", en: "Workers" }),
    },
    nodesTable: {
      lastSeen: t({ de: "Zuletzt gesehen", en: "Last Seen" }),
      name: t({ de: "Name", en: "Name" }),
      platform: t({ de: "Plattform", en: "Platform" }),
      settings: t({ de: "Einstellungen", en: "Settings" }),
      status: t({ de: "Status", en: "Status" }),
      workers: t({ de: "Workers", en: "Workers" }),
      workersActiveOfCores: insert(
        t({
          de: "{{workers}} aktiv von {{totalCores}} Kernen",
          en: "{{workers}} active of {{totalCores}} cores",
        }),
      ),
    },
    ownerFilterTabs: {
      all: t({ de: "Alle", en: "All" }),
      mine: t({ de: "Meine", en: "Mine" }),
      shared: t({ de: "Geteilt", en: "Shared" }),
    },
    settingsDialog: {
      access: t({ de: "Zugriff", en: "Access" }),
      cancel: t({ de: "Abbrechen", en: "Cancel" }),
      cannotBeUndone: t({
        de: "Diese Aktion kann nicht rückgängig gemacht werden.",
        en: "This action cannot be undone.",
      }),
      configureYourNodeSettings: t({
        de: "Konfiguriere deine Node-Einstellungen",
        en: "Configure your node settings",
      }),
      delete: t({ de: "Löschen", en: "Delete" }),
      deleteNode: t({ de: "Node löschen", en: "Delete Node" }),
      enableThisNode: t({
        de: "Diesen Node für Simulationen aktivieren",
        en: "Enable this node for simulations",
      }),
      nodeName: t({ de: "Node-Name", en: "Node Name" }),
      nodeSettings: t({ de: "Node-Einstellungen", en: "Node Settings" }),
      power: t({ de: "Power", en: "Power" }),
      saveChanges: t({ de: "Änderungen speichern", en: "Save Changes" }),
      selectAccessLevel: t({
        de: "Zugriffsebene auswählen",
        en: "Select access level",
      }),
      typeNodeNameToConfirm: t({
        de: "Gib den Node-Namen ein, um das Löschen zu bestätigen:",
        en: "Type the node name to confirm deletion:",
      }),
      workers: t({ de: "Workers", en: "Workers" }),
      workersOfCores: insert(
        t({
          de: "{{workers}} / {{totalCores}} Kerne",
          en: "{{workers}} / {{totalCores}} cores",
        }),
      ),
    },
    settingsPage: {
      actionsDescription: t({
        de: "Kontoaktionen und -verwaltung",
        en: "Account actions and management",
      }),
      actionsTitle: t({ de: "Aktionen", en: "Actions" }),
      cancel: t({ de: "Abbrechen", en: "Cancel" }),
      connectionsDescription: t({
        de: "Verknüpfte Drittanbieter-Konten",
        en: "Linked third-party accounts",
      }),
      connectionsTitle: t({ de: "Verbindungen", en: "Connections" }),
      deleteAccount: t({ de: "Konto löschen", en: "Delete Account" }),
      deletedHandle: t({
        de: "Dein Benutzername wird permanent gesperrt, auch für dich",
        en: "Your handle will be permanently blocked, including for you",
      }),
      deleteDialogDescription: t({
        de: "Dies wird dein Konto dauerhaft entfernen.",
        en: "This will permanently remove your account.",
      }),
      deletedJobs: t({
        de: "Alle Simulationsjobs und Ergebnisse",
        en: "All simulation jobs and results",
      }),
      deletedNodes: t({
        de: "Alle registrierten Nodes und deren Konfiguration",
        en: "All registered nodes and their configuration",
      }),
      deletedRotations: t({
        de: "Alle Rotationen und Versionsverläufe",
        en: "All rotations and version history",
      }),
      deleteWarningDescription: t({
        de: "Dein Konto, alle Daten und dein Benutzername werden unwiderruflich gelöscht. Dies kann nicht rückgängig gemacht werden.",
        en: "Your account, all associated data, and your handle will be permanently removed. This cannot be reversed.",
      }),
      deleteWarningTitle: t({
        de: "Diese Aktion ist endgültig",
        en: "This action is permanent",
      }),
      email: t({ de: "E-Mail", en: "Email" }),
      handle: t({ de: "Benutzername", en: "Handle" }),
      profileDescription: t({
        de: "Deine Kontoinformationen",
        en: "Your account information",
      }),
      profileTitle: t({ de: "Profil", en: "Profile" }),
      resetPreferences: t({
        de: "UI-Einstellungen zurücksetzen",
        en: "Reset UI Preferences",
      }),
      typeHandleToConfirm: t({
        de: "Gib deinen Benutzernamen ein, um das Löschen zu bestätigen:",
        en: "Type your handle to confirm deletion:",
      }),
      whatGetsDeleted: t({
        de: "Folgendes wird gelöscht:",
        en: "The following will be deleted:",
      }),
    },
    setupDialog: {
      cancel: t({ de: "Abbrechen", en: "Cancel" }),
      claimTokenDescription: t({
        de: "Gib diesen Token in der Node-App ein, um ihn mit deinem Konto zu verbinden.",
        en: "Enter this token in the node app to link it to your account.",
      }),
      copied: t({ de: "Kopiert!", en: "Copied!" }),
      copyDocker: t({
        de: "Docker-Befehl kopieren",
        en: "Copy Docker command",
      }),
      description: t({
        de: "Trage Rechenleistung zum verteilten Netzwerk bei und hilf, Simulationen schneller auszuführen.",
        en: "Contribute computing power to the distributed network and help run simulations faster.",
      }),
      desktop: t({ de: "Desktop", en: "Desktop" }),
      detected: t({ de: "Erkannt", en: "Detected" }),
      downloadCliHeadless: t({
        de: "CLI herunterladen (headless)",
        en: "Download CLI (headless)",
      }),
      downloadTitle: t({ de: "Node herunterladen", en: "Download Node" }),
      multiArchContainer: t({
        de: "Multi-Arch-Container für Server",
        en: "Multi-arch container for servers",
      }),
      readMore: t({ de: "Mehr erfahren", en: "Read more" }),
      regenerate: t({ de: "Regenerieren", en: "Regenerate" }),
      regenerateConfirmDescription: t({
        de: "Das Regenerieren deines Tokens macht das alte Token ungültig.",
        en: "Regenerating your token will invalidate the old token.",
      }),
      regenerateConfirmTitle: t({
        de: "Token regenerieren?",
        en: "Regenerate Token?",
      }),
      regenerateToken: t({ de: "Token regenerieren", en: "Regenerate token" }),
      regenerateWarning: t({
        de: "Alle Nodes, die das alte Token verwenden, müssen mit dem neuen Token neu konfiguriert werden.",
        en: "Any nodes using the old token will need to be reconfigured with the new token.",
      }),
      title: t({ de: "Eigenen Node betreiben", en: "Run Your Own Node" }),
      view: t({ de: "Ansehen", en: "View" }),
    },
  },
  description: "Content for account management.",
  key: "account",
  tags: ["account", "nodes"],
  title: "Account",
} satisfies Dictionary;

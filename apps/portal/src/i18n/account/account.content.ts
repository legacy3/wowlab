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
    claimForm: {
      claimNode: t({ de: "Node beanspruchen", en: "Claim Node" }),
      claimYourNode: t({
        de: "Beanspruche deinen Node",
        en: "Claim Your Node",
      }),
      configureYourNode: t({
        de: "Konfiguriere deinen Node",
        en: "Configure Your Node",
      }),
      dontHaveTheApp: t({
        de: "Du hast die App nicht?",
        en: "Don't have the app?",
      }),
      downloadNode: t({ de: "Node herunterladen", en: "Download Node" }),
      enterCodeDescription: t({
        de: "Gib den 6-stelligen Code ein, der von deiner Node-Anwendung angezeigt wird",
        en: "Enter the 6-character code displayed by your node application",
      }),
      nodeName: t({ de: "Node-Name", en: "Node Name" }),
      nodeNamePlaceholder: t({ de: "Mein Gaming-PC", en: "My Gaming PC" }),
      verifyCode: t({ de: "Code verifizieren", en: "Verify Code" }),
      workers: t({ de: "Workers", en: "Workers" }),
      workersHelperText: t({
        de: "Wie viele CPU-Kerne für Simulationen verwendet werden sollen",
        en: "How many CPU cores to dedicate to simulations",
      }),
      workersOfCores: insert(
        t({
          de: "{{workers}} / {{totalCores}} Kerne",
          en: "{{workers}} / {{totalCores}} cores",
        }),
      ),
    },
    claimPage: {
      downloadAndRun: t({
        de: "Lade die WoW Lab Node-Anwendung herunter und führe sie auf deinem Computer aus",
        en: "Download and run the WoW Lab Node application on your computer",
      }),
      error: t({ de: "Fehler", en: "Error" }),
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
      claimNode: t({ de: "Node beanspruchen", en: "Claim Node" }),
      claimNodeDescription: t({
        de: "Beanspruche einen Node, um Rechenressourcen für Simulationen beizutragen",
        en: "Claim a node to contribute compute resources for simulations",
      }),
      claimYourFirstNode: t({
        de: "Beanspruche deinen ersten Node",
        en: "Claim Your First Node",
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
  },
  description: "Content for account management.",
  key: "account",
  tags: ["account", "nodes"],
  title: "Account",
} satisfies Dictionary;

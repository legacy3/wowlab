import { type Dictionary, t } from "intlayer";

export default {
  content: {
    signInForm: {
      and: t({ de: " und ", en: " and " }),
      chooseMethod: t({
        de: "Wähle deine bevorzugte Anmeldemethode.",
        en: "Choose your preferred authentication method.",
      }),
      newHere: t({
        de: "Neu hier? Beim Anmelden wird automatisch ein Konto erstellt.",
        en: "New here? Signing in creates an account automatically.",
      }),
      privacyPolicy: t({
        de: "Datenschutzrichtlinie",
        en: "Privacy Policy",
      }),
      secureAuth: t({
        de: "Sichere Authentifizierung",
        en: "Secure authentication",
      }),
      signingYouIn: t({
        de: "Du wirst angemeldet...",
        en: "Signing you in...",
      }),
      signInToContinue: t({
        de: "Zum Fortfahren anmelden",
        en: "Sign in to continue",
      }),
      termsOfService: t({
        de: "Nutzungsbedingungen",
        en: "Terms of Service",
      }),
      termsPrefix: t({
        de: "Mit dem Fortfahren stimmst du unseren ",
        en: "By continuing, you agree to our ",
      }),
      termsSuffix: t({ de: " zu.", en: "." }),
    },
  },
  description: "Localized strings for authentication UI.",
  key: "auth",
  tags: ["auth", "sign-in"],
  title: "Auth",
} satisfies Dictionary;

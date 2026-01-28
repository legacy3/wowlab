import { type IntlayerConfig, Locales } from "intlayer";

const config: IntlayerConfig = {
  build: {
    importMode: "dynamic",
    optimize: true,
  },
  internationalization: {
    defaultLocale: Locales.ENGLISH,
    locales: [Locales.ENGLISH, Locales.GERMAN],
  },
  routing: {
    mode: "prefix-no-default",
    storage: "localStorage",
  },
};

export default config;

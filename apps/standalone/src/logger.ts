export const Logger = {
  header: (title: string) => {
    console.log("\n" + "=".repeat(60));
    console.log(` ${title} `);
    console.log("=".repeat(60));
  },

  info: (message: string) => console.log(`[INFO] ${message}`),

  json: (data: unknown) => console.log(JSON.stringify(data, null, 2)),

  kv: (key: string, value: unknown) => {
    console.log(`${key.padEnd(25)}: ${value}`);
  },

  subHeader: (title: string) => {
    console.log("\n" + "-".repeat(60));
    console.log(` ${title} `);
    console.log("-".repeat(60));
  },

  table: (data: unknown[]) => console.table(data),
};
